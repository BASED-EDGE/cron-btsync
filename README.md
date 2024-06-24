# what 
cdk

ec2 that deploys a resoli sync container https://github.com/linuxserver/docker-resilio-sync (since it will run on arm arch) + ebs data store

lambda on cron to turn machine on off 

## purpose

personal cloud back up WITHOUT 24/7 on time + limitted exposure

## todo
- see if can do ipv6 only.....
- better docs - (it currently starts on so the toggle schedule is backwards to start with , and needs to manually flipped)
- configurations
  - schedule
  - ebs size
  - ssh key name (not doc'd currently)



### how to connect to webui to setup server + add some folders
1. [install aws session manager plugin](https://docs.aws.amazon.com/systems-manager/latest/userguide/install-plugin-debian-and-ubuntu.html)
2. collect ec2 instance id from CDK output 
3. (optional) start ec2 server if currently stopped
3. [start forwarding session](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-sessions-start.html#sessions-start-port-forwarding) using the provided bash script (update values as needed) ```bash start-sess.bash```
4. visit [localhost:8889](http://localhost:8889)

### assumption
1. your data is already encrypted BEFORE syncing 

### suggested settings
- dont store deleted files (to save space)
- set upload speed limit (AWS charges for outgoing traffic)
