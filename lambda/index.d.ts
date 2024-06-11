import { EventBridgeEvent } from 'aws-lambda';
export declare function handler(event: EventBridgeEvent<"Scheduled Event", any>): Promise<void>;
