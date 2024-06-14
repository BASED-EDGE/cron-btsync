import { EventBridgeEvent } from 'aws-lambda'
import { EC2Client, StartInstancesCommand, DescribeInstanceStatusCommand, StopInstancesCommand } from '@aws-sdk/client-ec2'
const client = new EC2Client()
export async function handler(event: EventBridgeEvent<"Scheduled Event", any>) {


  const instaceId = process.env.instanceId!!

  const res = await client.send(new DescribeInstanceStatusCommand({
    InstanceIds: [instaceId],
    IncludeAllInstances: true // will let us describe stopped instances
  }))

  if (!res.InstanceStatuses) {
    console.error('not found?!?')
    return
  }
  const instance = res.InstanceStatuses[0]
  const state = instance.InstanceState?.Name

  if (state == 'running') {
    console.log(`stopping ${instance.InstanceId}`)
    await client.send(new StopInstancesCommand({ InstanceIds: [instance.InstanceId!!] }))
  } else if (state == 'stopped') {
    console.log(`startting ${instance.InstanceId}`)
    await client.send(new StartInstancesCommand({ InstanceIds: [instance.InstanceId!!] }))
  } else {
    console.warn(`unexpected state ${state} for ${console.log(`stopping ${instance.InstanceId}`)}`)
  }

}