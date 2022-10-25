import {
  CloudWatchLogsClient,
  AssociateKmsKeyCommand,
} from '@aws-sdk/client-cloudwatch-logs';

import * as AWS from 'aws-sdk';
AWS.config.loadFromPath('./config.json');
var cloudwatch = new AWS.CloudWatch({ apiVersion: '2010-08-01' });
const client = new CloudWatchLogsClient({ region: 'REGION' });
client.config();
const params = {
  logGroupName: '/aws/lambda/test',
  /** input parameters */
};
const command = new AssociateKmsKeyCommand(params);
try {
  cloudwatch.describeLo;
  const data = await client.send(command);
  console.log('data  :', data);
  // process data.
} catch (error) {
  // error handling.
} finally {
  // finally.
}
