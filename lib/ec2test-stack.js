"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ec2TestStack = void 0;
const cdk = require("aws-cdk-lib");
// import * as sqs from 'aws-cdk-lib/aws-sqs';
const aws_ec2_1 = require("aws-cdk-lib/aws-ec2");
const aws_lambda_1 = require("aws-cdk-lib/aws-lambda");
const aws_events_1 = require("aws-cdk-lib/aws-events");
const aws_events_targets_1 = require("aws-cdk-lib/aws-events-targets");
const aws_lambda_nodejs_1 = require("aws-cdk-lib/aws-lambda-nodejs");
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
class Ec2TestStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        let vpc = new aws_ec2_1.Vpc(this, 'vpc', {
            natGateways: 0,
            subnetConfiguration: [
                {
                    cidrMask: 24,
                    name: 'ServerPublic',
                    subnetType: aws_ec2_1.SubnetType.PUBLIC,
                    mapPublicIpOnLaunch: true,
                },
            ],
            maxAzs: 2,
        });
        let securityGroup = new aws_ec2_1.SecurityGroup(this, 'ec2InstanceSecurityGroup', { vpc: vpc, allowAllOutbound: true });
        securityGroup.addIngressRule(aws_ec2_1.Peer.anyIpv4(), aws_ec2_1.Port.tcp(22)); // replace with SSM ? socksProxy-able?
        const userData = aws_ec2_1.UserData.forLinux();
        const instanceName = 'cronsync';
        // Add user data that is used to configure the EC2 instance
        userData.addCommands(...`yum update -y
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
      docker run -d --name sync -p 127.0.0.1:8888:8888 -p 55555 -v /data/sync:/mnt/sync --restart always resilio/sync`.split('\n'));
        // watchtower + auto updates from yum
        let ec2 = new aws_ec2_1.Instance(this, 'instace', {
            instanceType: aws_ec2_1.InstanceType.of(aws_ec2_1.InstanceClass.T4G, aws_ec2_1.InstanceSize.NANO),
            machineImage: aws_ec2_1.MachineImage.latestAmazonLinux2023({
                cachedInContext: false,
                cpuType: aws_ec2_1.AmazonLinuxCpuType.ARM_64,
            }),
            vpc,
            userData,
            securityGroup,
            blockDevices: [{
                    deviceName: '/dev/sdh',
                    volume: aws_ec2_1.BlockDeviceVolume.ebs(50, { encrypted: true, deleteOnTermination: true /* todo - make false */, }),
                    mappingEnabled: true
                }],
            instanceName,
            keyPair: aws_ec2_1.KeyPair.fromKeyPairName(this, "simonraytest", "simonraytest") // needs to be manually created earlier
        });
        new cdk.CfnOutput(this, 'ec2DnsName', { value: ec2.instancePublicDnsName });
        const startRule = new aws_events_1.Rule(this, 'startRule', {
            schedule: aws_events_1.Schedule.expression('cron(0 12 * * ? *)'),
        });
        const stopRule = new aws_events_1.Rule(this, 'stopRule', {
            schedule: aws_events_1.Schedule.expression('cron(0 13 * * ? *)'),
        });
        // create 2 CW crons
        const startFunction = new aws_lambda_nodejs_1.NodejsFunction(this, 'MyFunction', {
            functionName: 'toggleCronSync',
            runtime: aws_lambda_1.Runtime.NODEJS_LATEST,
            entry: './lambda/index.ts',
            handler: 'handler', // defaults to 'handler'
        });
        startFunction.addToRolePolicy(new aws_iam_1.PolicyStatement({
            sid: 'ec2Perms',
            effect: aws_iam_1.Effect.ALLOW,
            actions: [
                'ec2:DescribeInstanceStatus',
                'ec2:StartInstances',
                'ec2:StopInstances',
            ],
            resources: ['*'] // todo - limit to account + region
        }));
        startRule.addTarget(new aws_events_targets_1.LambdaFunction(startFunction));
        stopRule.addTarget(new aws_events_targets_1.LambdaFunction(startFunction));
        // start + stop
    }
}
exports.Ec2TestStack = Ec2TestStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWMydGVzdC1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImVjMnRlc3Qtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbUNBQW1DO0FBRW5DLDhDQUE4QztBQUM5QyxpREFBbU47QUFDbk4sdURBQTBEO0FBQzFELHVEQUF3RDtBQUd4RCx1RUFBZ0U7QUFDaEUscUVBQStEO0FBQy9ELGlEQUE4RDtBQUU5RCxNQUFhLFlBQWEsU0FBUSxHQUFHLENBQUMsS0FBSztJQUN6QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBR3hCLElBQUksR0FBRyxHQUFHLElBQUksYUFBRyxDQUFDLElBQUksRUFBQyxLQUFLLEVBQUM7WUFDM0IsV0FBVyxFQUFFLENBQUM7WUFDZCxtQkFBbUIsRUFBRTtnQkFDbkI7b0JBQ0UsUUFBUSxFQUFFLEVBQUU7b0JBQ1osSUFBSSxFQUFFLGNBQWM7b0JBQ3BCLFVBQVUsRUFBRSxvQkFBVSxDQUFDLE1BQU07b0JBQzdCLG1CQUFtQixFQUFFLElBQUk7aUJBQzFCO2FBQ0Y7WUFDRCxNQUFNLEVBQUUsQ0FBQztTQUNWLENBQUMsQ0FBQTtRQUVGLElBQUksYUFBYSxHQUFHLElBQUksdUJBQWEsQ0FDbkMsSUFBSSxFQUNKLDBCQUEwQixFQUMxQixFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxFQUFFLENBQ3JDLENBQUM7UUFDRixhQUFhLENBQUMsY0FBYyxDQUFDLGNBQUksQ0FBQyxPQUFPLEVBQUUsRUFBRSxjQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxzQ0FBc0M7UUFDbEcsTUFBTSxRQUFRLEdBQUcsa0JBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNuQyxNQUFNLFlBQVksR0FBRyxVQUFVLENBQUE7UUFDakMsMkRBQTJEO1FBQzNELFFBQVEsQ0FBQyxXQUFXLENBQ2xCLEdBQ0E7Ozs7Ozs7Ozs7O3NIQVdnSCxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FDN0gsQ0FBQztRQUNGLHFDQUFxQztRQUNyQyxJQUFJLEdBQUcsR0FBRyxJQUFJLGtCQUFRLENBQUMsSUFBSSxFQUFDLFNBQVMsRUFBQztZQUNwQyxZQUFZLEVBQUUsc0JBQVksQ0FBQyxFQUFFLENBQUMsdUJBQWEsQ0FBQyxHQUFHLEVBQUUsc0JBQVksQ0FBQyxJQUFJLENBQUM7WUFDbkUsWUFBWSxFQUFFLHNCQUFZLENBQUMscUJBQXFCLENBQUM7Z0JBQy9DLGVBQWUsRUFBRSxLQUFLO2dCQUN0QixPQUFPLEVBQUMsNEJBQWtCLENBQUMsTUFBTTthQUNsQyxDQUFDO1lBQ0YsR0FBRztZQUNILFFBQVE7WUFDUixhQUFhO1lBQ2IsWUFBWSxFQUFDLENBQUM7b0JBQ1osVUFBVSxFQUFDLFVBQVU7b0JBQ3JCLE1BQU0sRUFBRSwyQkFBaUIsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFDLEVBQUMsU0FBUyxFQUFDLElBQUksRUFBQyxtQkFBbUIsRUFBQyxJQUFJLENBQUMsdUJBQXVCLEdBQUUsQ0FBQztvQkFDcEcsY0FBYyxFQUFDLElBQUk7aUJBQ3BCLENBQUM7WUFDRixZQUFZO1lBQ1osT0FBTyxFQUFFLGlCQUFPLENBQUMsZUFBZSxDQUFDLElBQUksRUFBQyxjQUFjLEVBQUMsY0FBYyxDQUFDLENBQUMsdUNBQXVDO1NBQzdHLENBQUMsQ0FBQTtRQUVGLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDLENBQUM7UUFHNUUsTUFBTSxTQUFTLEdBQUcsSUFBSSxpQkFBSSxDQUFDLElBQUksRUFBRSxXQUFXLEVBQUU7WUFDNUMsUUFBUSxFQUFFLHFCQUFRLENBQUMsVUFBVSxDQUFDLG9CQUFvQixDQUFDO1NBRXBELENBQUMsQ0FBQTtRQUVGLE1BQU0sUUFBUSxHQUFHLElBQUksaUJBQUksQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFO1lBQzFDLFFBQVEsRUFBRSxxQkFBUSxDQUFDLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQztTQUNwRCxDQUFDLENBQUM7UUFHSCxvQkFBb0I7UUFDcEIsTUFBTSxhQUFhLEdBQUUsSUFBSSxrQ0FBYyxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUU7WUFDMUQsWUFBWSxFQUFDLGdCQUFnQjtZQUM3QixPQUFPLEVBQUUsb0JBQU8sQ0FBQyxhQUFhO1lBQzlCLEtBQUssRUFBRSxtQkFBbUI7WUFDMUIsT0FBTyxFQUFFLFNBQVMsRUFBRSx3QkFBd0I7U0FDN0MsQ0FBQyxDQUFDO1FBRUgsYUFBYSxDQUFDLGVBQWUsQ0FBQyxJQUFJLHlCQUFlLENBQUM7WUFDaEQsR0FBRyxFQUFDLFVBQVU7WUFDZCxNQUFNLEVBQUMsZ0JBQU0sQ0FBQyxLQUFLO1lBQ25CLE9BQU8sRUFBQztnQkFDTiw0QkFBNEI7Z0JBQzVCLG9CQUFvQjtnQkFDcEIsbUJBQW1CO2FBQ3BCO1lBQ0QsU0FBUyxFQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsbUNBQW1DO1NBQ3BELENBQUMsQ0FBQyxDQUFBO1FBRUgsU0FBUyxDQUFDLFNBQVMsQ0FBQyxJQUFJLG1DQUFjLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQTtRQUN0RCxRQUFRLENBQUMsU0FBUyxDQUFDLElBQUksbUNBQWMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFBO1FBQ3JELGVBQWU7SUFHakIsQ0FBQztDQUNGO0FBbkdELG9DQW1HQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbi8vIGltcG9ydCAqIGFzIHNxcyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc3FzJztcbmltcG9ydCB7QW1hem9uTGludXhDcHVUeXBlLCBCbG9ja0RldmljZVZvbHVtZSwgSW5zdGFuY2UsIEluc3RhbmNlQ2xhc3MsIEluc3RhbmNlU2l6ZSwgSW5zdGFuY2VUeXBlLCBLZXlQYWlyLCBNYWNoaW5lSW1hZ2UsIFBlZXIsIFBvcnQsIFNlY3VyaXR5R3JvdXAsIFN1Ym5ldFR5cGUsIFVzZXJEYXRhLCBWb2x1bWUsIFZwY30gZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjMidcbmltcG9ydCB7IEZ1bmN0aW9uLCBSdW50aW1lIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYSdcbmltcG9ydCB7IFJ1bGUsIFNjaGVkdWxlIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWV2ZW50cyc7XG5pbXBvcnQgeyBzdGFydCB9IGZyb20gJ3JlcGwnO1xuaW1wb3J0IHsgTGFtYmRhVGFyZ2V0IH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWVsYXN0aWNsb2FkYmFsYW5jaW5ndjItdGFyZ2V0cyc7XG5pbXBvcnQgeyBMYW1iZGFGdW5jdGlvbiB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1ldmVudHMtdGFyZ2V0cyc7XG5pbXBvcnQgeyBOb2RlanNGdW5jdGlvbiB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEtbm9kZWpzJztcbmltcG9ydCB7IEVmZmVjdCwgUG9saWN5U3RhdGVtZW50IH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5cbmV4cG9ydCBjbGFzcyBFYzJUZXN0U3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cblxuICAgIGxldCB2cGMgPSBuZXcgVnBjKHRoaXMsJ3ZwYycse1xuICAgICAgbmF0R2F0ZXdheXM6IDAsXG4gICAgICBzdWJuZXRDb25maWd1cmF0aW9uOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBjaWRyTWFzazogMjQsXG4gICAgICAgICAgbmFtZTogJ1NlcnZlclB1YmxpYycsXG4gICAgICAgICAgc3VibmV0VHlwZTogU3VibmV0VHlwZS5QVUJMSUMsXG4gICAgICAgICAgbWFwUHVibGljSXBPbkxhdW5jaDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICBtYXhBenM6IDIsXG4gICAgfSlcblxuICAgIGxldCBzZWN1cml0eUdyb3VwID0gbmV3IFNlY3VyaXR5R3JvdXAoXG4gICAgICB0aGlzLFxuICAgICAgJ2VjMkluc3RhbmNlU2VjdXJpdHlHcm91cCcsXG4gICAgICB7IHZwYzogdnBjLCBhbGxvd0FsbE91dGJvdW5kOiB0cnVlIH0sXG4gICAgKTtcbiAgICBzZWN1cml0eUdyb3VwLmFkZEluZ3Jlc3NSdWxlKFBlZXIuYW55SXB2NCgpLCBQb3J0LnRjcCgyMikpOyAvLyByZXBsYWNlIHdpdGggU1NNID8gc29ja3NQcm94eS1hYmxlP1xuICAgIGNvbnN0IHVzZXJEYXRhID0gVXNlckRhdGEuZm9yTGludXgoKTtcbiAgICAgIGNvbnN0IGluc3RhbmNlTmFtZSA9ICdjcm9uc3luYydcbiAgICAvLyBBZGQgdXNlciBkYXRhIHRoYXQgaXMgdXNlZCB0byBjb25maWd1cmUgdGhlIEVDMiBpbnN0YW5jZVxuICAgIHVzZXJEYXRhLmFkZENvbW1hbmRzKFxuICAgICAgLi4uXG4gICAgICBgeXVtIHVwZGF0ZSAteVxuICAgICAgc3VkbyB5dW0gaW5zdGFsbCAteSBkb2NrZXJcbiAgICAgIHN1ZG8gc2VydmljZSBkb2NrZXIgc3RhcnRcbiAgICAgIHN1ZG8gdXNlcm1vZCAtYSAtRyBkb2NrZXIgZWMyLXVzZXJcbiAgICAgIGRvY2tlciBwc1xuICAgICAgc3VkbyBta2ZzIC10IHhmcyAvZGV2L3NkaFxuICAgICAgc3VkbyBta2RpciAvZGF0YVxuICAgICAgc3VkbyBzaCAtYyAnZWNobyBcIi9kZXYvc2RoICAgICAgIC9kYXRhICAgeGZzICAgIGRlZmF1bHRzLG5vZmFpbCAgICAgICAgMCAgICAgICAyXCIgPj4gL2V0Yy9mc3RhYidcbiAgICAgIHN1ZG8gbW91bnQgLWFcbiAgICAgIHN1ZG8gY2hvd24gZWMyLXVzZXIgL2RhdGFcbiAgICAgIG1rZGlyIC9kYXRhL3N5bmNcbiAgICAgIGRvY2tlciBydW4gLWQgLS1uYW1lIHN5bmMgLXAgMTI3LjAuMC4xOjg4ODg6ODg4OCAtcCA1NTU1NSAtdiAvZGF0YS9zeW5jOi9tbnQvc3luYyAtLXJlc3RhcnQgYWx3YXlzIHJlc2lsaW8vc3luY2Auc3BsaXQoJ1xcbicpLCAvLyB3aWxsIGFjY2VzcyBzZXJ2ZXIgdGhyb3VnaCBzc2ggc29ja3MgcHJveHkgKGZvciBleHRyYSBzZWN1cml0eSlcbiAgICApO1xuICAgIC8vIHdhdGNodG93ZXIgKyBhdXRvIHVwZGF0ZXMgZnJvbSB5dW1cbiAgICBsZXQgZWMyID0gbmV3IEluc3RhbmNlKHRoaXMsJ2luc3RhY2UnLHtcbiAgICAgIGluc3RhbmNlVHlwZTogSW5zdGFuY2VUeXBlLm9mKEluc3RhbmNlQ2xhc3MuVDRHLCBJbnN0YW5jZVNpemUuTkFOTyksXG4gICAgICBtYWNoaW5lSW1hZ2U6IE1hY2hpbmVJbWFnZS5sYXRlc3RBbWF6b25MaW51eDIwMjMoe1xuICAgICAgICBjYWNoZWRJbkNvbnRleHQ6IGZhbHNlLFxuICAgICAgICBjcHVUeXBlOkFtYXpvbkxpbnV4Q3B1VHlwZS5BUk1fNjQgLFxuICAgICAgfSksXG4gICAgICB2cGMsXG4gICAgICB1c2VyRGF0YSxcbiAgICAgIHNlY3VyaXR5R3JvdXAsXG4gICAgICBibG9ja0RldmljZXM6W3tcbiAgICAgICAgZGV2aWNlTmFtZTonL2Rldi9zZGgnLFxuICAgICAgICB2b2x1bWU6IEJsb2NrRGV2aWNlVm9sdW1lLmVicyg1MCx7ZW5jcnlwdGVkOnRydWUsZGVsZXRlT25UZXJtaW5hdGlvbjp0cnVlIC8qIHRvZG8gLSBtYWtlIGZhbHNlICovLH0pLFxuICAgICAgICBtYXBwaW5nRW5hYmxlZDp0cnVlXG4gICAgICB9XSAgICxcbiAgICAgIGluc3RhbmNlTmFtZSxcbiAgICAgIGtleVBhaXI6IEtleVBhaXIuZnJvbUtleVBhaXJOYW1lKHRoaXMsXCJzaW1vbnJheXRlc3RcIixcInNpbW9ucmF5dGVzdFwiKSAvLyBuZWVkcyB0byBiZSBtYW51YWxseSBjcmVhdGVkIGVhcmxpZXJcbiAgICB9KVxuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ2VjMkRuc05hbWUnLCB7IHZhbHVlOiBlYzIuaW5zdGFuY2VQdWJsaWNEbnNOYW1lIH0pO1xuXG4gICAgXG4gICAgY29uc3Qgc3RhcnRSdWxlID0gbmV3IFJ1bGUodGhpcywgJ3N0YXJ0UnVsZScsIHtcbiAgICAgIHNjaGVkdWxlOiBTY2hlZHVsZS5leHByZXNzaW9uKCdjcm9uKDAgMTIgKiAqID8gKiknKSxcblxuICAgIH0pXG5cbiAgICBjb25zdCBzdG9wUnVsZSA9IG5ldyBSdWxlKHRoaXMsICdzdG9wUnVsZScsIHtcbiAgICAgIHNjaGVkdWxlOiBTY2hlZHVsZS5leHByZXNzaW9uKCdjcm9uKDAgMTMgKiAqID8gKiknKSxcbiAgICB9KTtcbiAgICBcblxuICAgIC8vIGNyZWF0ZSAyIENXIGNyb25zXG4gICAgY29uc3Qgc3RhcnRGdW5jdGlvbiA9bmV3IE5vZGVqc0Z1bmN0aW9uKHRoaXMsICdNeUZ1bmN0aW9uJywge1xuICAgICAgZnVuY3Rpb25OYW1lOid0b2dnbGVDcm9uU3luYycsXG4gICAgICBydW50aW1lOiBSdW50aW1lLk5PREVKU19MQVRFU1QsXG4gICAgICBlbnRyeTogJy4vbGFtYmRhL2luZGV4LnRzJywgLy8gYWNjZXB0cyAuanMsIC5qc3gsIC5janMsIC5tanMsIC50cywgLnRzeCwgLmN0cyBhbmQgLm10cyBmaWxlc1xuICAgICAgaGFuZGxlcjogJ2hhbmRsZXInLCAvLyBkZWZhdWx0cyB0byAnaGFuZGxlcidcbiAgICB9KTtcbiAgICBcbiAgICBzdGFydEZ1bmN0aW9uLmFkZFRvUm9sZVBvbGljeShuZXcgUG9saWN5U3RhdGVtZW50KHtcbiAgICAgIHNpZDonZWMyUGVybXMnLFxuICAgICAgZWZmZWN0OkVmZmVjdC5BTExPVyxcbiAgICAgIGFjdGlvbnM6W1xuICAgICAgICAnZWMyOkRlc2NyaWJlSW5zdGFuY2VTdGF0dXMnLFxuICAgICAgICAnZWMyOlN0YXJ0SW5zdGFuY2VzJyxcbiAgICAgICAgJ2VjMjpTdG9wSW5zdGFuY2VzJyxcbiAgICAgIF0sXG4gICAgICByZXNvdXJjZXM6WycqJ10gLy8gdG9kbyAtIGxpbWl0IHRvIGFjY291bnQgKyByZWdpb25cbiAgICB9KSlcblxuICAgIHN0YXJ0UnVsZS5hZGRUYXJnZXQobmV3IExhbWJkYUZ1bmN0aW9uKHN0YXJ0RnVuY3Rpb24pKVxuICAgIHN0b3BSdWxlLmFkZFRhcmdldChuZXcgTGFtYmRhRnVuY3Rpb24oc3RhcnRGdW5jdGlvbikpXG4gICAgLy8gc3RhcnQgKyBzdG9wXG5cblxuICB9XG59XG4iXX0=