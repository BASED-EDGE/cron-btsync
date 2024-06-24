#export AWS_REGION=us-west-2
#export AWS_PROFILE=OPTIONAL

aws ssm start-session \
	--target i-<REPLACE_ME_FROM_CDK_OUTPUT> \
	--document-name AWS-StartPortForwardingSession \
	--parameters '{ "portNumber":["8888"], "localPortNumber":["8889"]}'
