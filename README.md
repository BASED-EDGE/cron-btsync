cdk

ec2 that deploys a resoli sync container + ebs data store

lambda on cron to turn machine on off 

purpose

personal cloud back up WITHOUT 24/7 on time
limit exposure

todo
- dont expose port 22, use session manager
- see if can do ipv6 only.....
- better docs - (it currently starts on so the toggle schedule is backwards to start with , and needs to manually flipped)
- configurations
  - schedule
  - ebs size
  - ssh key name (not doc'd currently)



how to connect to webui to setup server + add some folders
1. use ssh to set up socks proxy on ec2
```
ssh -D 9999 -i sync2.pem ec2-user@<elastic ipv4>.<region>.compute.amazonaws.com 
```
2. then set a socks5 proxy on your brower (enable proxy DNS if option is present)
3. visit
http://localhost4.localdomain4:8888/gui/

todo test https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-sessions-start.html#sessions-start-port-forwarding

assumption
1. your data is already encrypted BEFORE syncing 

suggested settings
- dont store deleted files (to save space)
- set upload speed limit (AWS charges for outgoing traffic)
