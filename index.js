const AWS_CW = require('@aws-sdk/client-cloudwatch-logs');
const AWS = require('aws-sdk');
AWS.config.loadFromPath('./config.json');
var cloudwatch = new AWS.CloudWatchLogs();
const client = new AWS_CW.CloudWatchLogsClient({ region: 'ap-southeast-1' });
// client.config();
const params = {
  logGroupName: '/ecs/zyum-dev-sg-td-leads',
  limit: 5,
  startTime: 1664582400,
  endTime: 1666569600,
  queryString: '/Lead Record/',
  logRecordPointer: '*',
  // logStreamName: 'ecs/zyum-dev-sg-cntr-leads/00d79085517540b3bab4247fca6f5132',
  // order-by:'timestamp'
  /** input parameters */
};
const command = new AWS_CW.StartQueryCommand(params);
console.log('command ', command);
getLogs();

async function getLogs() {
  try {
    console.log('data ');

    // cloudwatch.getLogEvents(params, (err, data) => {
    //   if (err) console.log('err  : ', err);
    //   else console.log('data  ', data);
    // });
    cloudwatch.fin;
    const data = await client.send(command);
    console.log('data  :', data);
    // process data.
  } catch (error) {
    // error handling.
    console.log(error);
  } finally {
    // finally.
  }
}
