"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_ec2_1 = require("@aws-sdk/client-ec2");
const client = new client_ec2_1.EC2Client();
async function handler(event) {
    const res = await client.send(new client_ec2_1.DescribeInstanceStatusCommand({ Filters: [{
                Name: 'tag:Name',
                Values: ['cronsync']
            }] }));
    if (!res.InstanceStatuses) {
        console.error('not found?!?');
        return;
    }
    const instance = res.InstanceStatuses[0];
    const state = instance.InstanceState?.Name;
    if (state == 'running') {
        console.log(`stopping ${instance.InstanceId}`);
        await client.send(new client_ec2_1.StopInstancesCommand({ InstanceIds: [instance.InstanceId] }));
    }
    else if (state == 'stopped') {
        console.log(`startting ${instance.InstanceId}`);
        await client.send(new client_ec2_1.StartInstancesCommand({ InstanceIds: [instance.InstanceId] }));
    }
    else {
        console.warn(`unexpected state ${state} for ${console.log(`stopping ${instance.InstanceId}`)}`);
    }
}
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSxvREFBeUg7QUFDekgsTUFBTSxNQUFNLEdBQUcsSUFBSSxzQkFBUyxFQUFFLENBQUE7QUFDdkIsS0FBSyxVQUFVLE9BQU8sQ0FBQyxLQUE4QztJQUM1RSxNQUFNLEdBQUcsR0FBRyxNQUFNLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSwwQ0FBNkIsQ0FBQyxFQUFDLE9BQU8sRUFBQyxDQUFDO2dCQUN4RSxJQUFJLEVBQUMsVUFBVTtnQkFDZixNQUFNLEVBQUMsQ0FBQyxVQUFVLENBQUM7YUFDcEIsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFBO0lBRUwsSUFBRyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBQztRQUN2QixPQUFPLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFBO1FBQzdCLE9BQU07S0FDUDtJQUNELE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUN4QyxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQTtJQUUxQyxJQUFJLEtBQUssSUFBSSxTQUFTLEVBQUM7UUFDckIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLFFBQVEsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFBO1FBQzlDLE1BQU0sTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLGlDQUFvQixDQUFDLEVBQUMsV0FBVyxFQUFDLENBQUMsUUFBUSxDQUFDLFVBQVksQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFBO0tBQ25GO1NBQUssSUFBRyxLQUFLLElBQUksU0FBUyxFQUFDO1FBQzFCLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxRQUFRLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQTtRQUNqRCxNQUFNLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxrQ0FBcUIsQ0FBQyxFQUFDLFdBQVcsRUFBQyxDQUFDLFFBQVEsQ0FBQyxVQUFZLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQTtLQUNsRjtTQUFLO1FBQ0osT0FBTyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsS0FBSyxRQUFRLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxRQUFRLENBQUMsVUFBVSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUE7S0FDaEc7QUFFRCxDQUFDO0FBdkJELDBCQXVCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7RXZlbnRCcmlkZ2VFdmVudH0gZnJvbSAnYXdzLWxhbWJkYSdcbmltcG9ydCB7RUMyQ2xpZW50LCBTdGFydEluc3RhbmNlc0NvbW1hbmQsIERlc2NyaWJlSW5zdGFuY2VTdGF0dXNDb21tYW5kLCBTdG9wSW5zdGFuY2VzQ29tbWFuZH0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LWVjMidcbmNvbnN0IGNsaWVudCA9IG5ldyBFQzJDbGllbnQoKVxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIoZXZlbnQ6RXZlbnRCcmlkZ2VFdmVudDxcIlNjaGVkdWxlZCBFdmVudFwiLCBhbnk+KXtcbmNvbnN0IHJlcyA9IGF3YWl0IGNsaWVudC5zZW5kKG5ldyBEZXNjcmliZUluc3RhbmNlU3RhdHVzQ29tbWFuZCh7RmlsdGVyczpbe1xuICBOYW1lOid0YWc6TmFtZScsXG4gIFZhbHVlczpbJ2Nyb25zeW5jJ11cbn1dfSkpXG5cbmlmKCFyZXMuSW5zdGFuY2VTdGF0dXNlcyl7XG4gIGNvbnNvbGUuZXJyb3IoJ25vdCBmb3VuZD8hPycpXG4gIHJldHVyblxufVxuY29uc3QgaW5zdGFuY2UgPSByZXMuSW5zdGFuY2VTdGF0dXNlc1swXVxuY29uc3Qgc3RhdGUgPSBpbnN0YW5jZS5JbnN0YW5jZVN0YXRlPy5OYW1lXG5cbmlmIChzdGF0ZSA9PSAncnVubmluZycpe1xuICBjb25zb2xlLmxvZyhgc3RvcHBpbmcgJHtpbnN0YW5jZS5JbnN0YW5jZUlkfWApXG4gIGF3YWl0IGNsaWVudC5zZW5kKG5ldyBTdG9wSW5zdGFuY2VzQ29tbWFuZCh7SW5zdGFuY2VJZHM6W2luc3RhbmNlLkluc3RhbmNlSWQhIV19KSlcbn1lbHNlIGlmKHN0YXRlID09ICdzdG9wcGVkJyl7XG4gIGNvbnNvbGUubG9nKGBzdGFydHRpbmcgJHtpbnN0YW5jZS5JbnN0YW5jZUlkfWApXG5hd2FpdCBjbGllbnQuc2VuZChuZXcgU3RhcnRJbnN0YW5jZXNDb21tYW5kKHtJbnN0YW5jZUlkczpbaW5zdGFuY2UuSW5zdGFuY2VJZCEhXX0pKVxufWVsc2Uge1xuICBjb25zb2xlLndhcm4oYHVuZXhwZWN0ZWQgc3RhdGUgJHtzdGF0ZX0gZm9yICR7Y29uc29sZS5sb2coYHN0b3BwaW5nICR7aW5zdGFuY2UuSW5zdGFuY2VJZH1gKX1gKVxufVxuXG59Il19