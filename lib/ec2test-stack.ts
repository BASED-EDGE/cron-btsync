import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import {AmazonLinuxCpuType, BlockDeviceVolume, Instance, InstanceClass, InstanceSize, InstanceType, KeyPair, MachineImage, Peer, Port, SecurityGroup, SubnetType, UserData, Volume, Vpc} from 'aws-cdk-lib/aws-ec2'
import { Function, Runtime } from 'aws-cdk-lib/aws-lambda'
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { start } from 'repl';
import { LambdaTarget } from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';

export class Ec2TestStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    let vpc = new Vpc(this,'vpc',{
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'ServerPublic',
          subnetType: SubnetType.PUBLIC,
          mapPublicIpOnLaunch: true,
        },
      ],
      maxAzs: 2,
    })

    let securityGroup = new SecurityGroup(
      this,
      'ec2InstanceSecurityGroup',
      { vpc: vpc, allowAllOutbound: true },
    );
    securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(22)); // replace with SSM ? socksProxy-able?
    const userData = UserData.forLinux();
      const instanceName = 'cronsync'
    // Add user data that is used to configure the EC2 instance
    userData.addCommands(
      ...
      `yum update -y
      sudo yum install -y docker
      sudo service docker start
      sudo usermod -a -G docker ec2-user
      docker ps
      sudo mkfs -t xfs /dev/sdh
      sudo mkdir /data
      sudo sh -c 'echo "/dev/sdh       /data   xfs    defaults,nofail        0       2" >> /etc/fstab'
      sudo mount -a
      sudo chown ec2-user /data
      mkdir /data/sync
      docker run -d --name sync -p 127.0.0.1:8888:8888 -p 55555 -v /data/sync:/mnt/sync --restart always resilio/sync`.split('\n'), // will access server through ssh socks proxy (for extra security)
    );
    // watchtower + auto updates from yum
    let ec2 = new Instance(this,'instace',{
      instanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.NANO),
      machineImage: MachineImage.latestAmazonLinux2023({
        cachedInContext: false,
        cpuType:AmazonLinuxCpuType.ARM_64 ,
      }),
      vpc,
      userData,
      securityGroup,
      blockDevices:[{
        deviceName:'/dev/sdh',
        volume: BlockDeviceVolume.ebs(50,{encrypted:true,deleteOnTermination:true /* todo - make false */,}),
        mappingEnabled:true
      }]   ,
      instanceName,
      keyPair: KeyPair.fromKeyPairName(this,"simonraytest","simonraytest") // needs to be manually created earlier
    })

    new cdk.CfnOutput(this, 'ec2DnsName', { value: ec2.instancePublicDnsName });

    
    const startRule = new Rule(this, 'startRule', {
      schedule: Schedule.expression('cron(0 12 * * ? *)'),

    })

    const stopRule = new Rule(this, 'stopRule', {
      schedule: Schedule.expression('cron(0 13 * * ? *)'),
    });
    

    // create 2 CW crons
    const startFunction =new NodejsFunction(this, 'MyFunction', {
      functionName:'toggleCronSync',
      runtime: Runtime.NODEJS_LATEST,
      entry: './lambda/index.ts', // accepts .js, .jsx, .cjs, .mjs, .ts, .tsx, .cts and .mts files
      handler: 'handler', // defaults to 'handler'
    });
    
    startFunction.addToRolePolicy(new PolicyStatement({
      sid:'ec2Perms',
      effect:Effect.ALLOW,
      actions:[
        'ec2:DescribeInstanceStatus',
        'ec2:StartInstances',
        'ec2:StopInstances',
      ],
      resources:['*'] // todo - limit to account + region
    }))

    startRule.addTarget(new LambdaFunction(startFunction))
    stopRule.addTarget(new LambdaFunction(startFunction))
    // start + stop


  }
}
