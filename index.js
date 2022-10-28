var crypto = require('crypto');
const fs = require('fs');
const {
  GetQueryResultsCommand,
  QueryStatus,
} = require('@aws-sdk/client-cloudwatch-logs');
const AWS_CW = require('@aws-sdk/client-cloudwatch-logs');
const AWS = require('aws-sdk');
AWS.config.loadFromPath('./config.json');
var cloudwatch = new AWS.CloudWatchLogs();
const client = new AWS_CW.CloudWatchLogsClient({ region: 'ap-southeast-1' });
const logGroupName = '/ecs/zycc-dev-sg-td-clinic-cloud'; //'/ecs/zyum-dev-sg-td-leads';

getLogs();

async function getCloudWatchLogs(params) {
  try {
    const startQuery = await client.send(new AWS_CW.StartQueryCommand(params));
    console.log('startQuery  :', startQuery);
    const queryId = startQuery.queryId;
    let queryStatus = { status: QueryStatus.Scheduled };
    if (queryId) {
      while (
        queryStatus.status == QueryStatus.Scheduled ||
        queryStatus.status == QueryStatus.Running
      ) {
        await timeout(1000);
        console.log('timeout complete');
        queryStatus = await client.send(
          new GetQueryResultsCommand({
            queryId,
          })
        );
      }
    }
    // process data.

    const results = queryStatus.results;
    return results;
  } catch (err) {
    console.log('error ', err);
  }
}
async function getLogs() {
  // Translate results into an array of key/value pairs, excluding the pointer field
  const logs = await getCloudWatchLogs({
    logGroupName,
    startTime: 1666985400000,
    endTime: 1666985410000,
    queryString: 'fields @timestamp, @message|sort @timestamp asc | limit 3',
  });
  const formattedInitialLogs = formatLogs(logs);
  writeToFile(formattedInitialLogs, 'initialLogs.json');
  console.log('initial Logs : ', formattedInitialLogs);
  const logMap = {};
  let count = 0;
  await Promise.all(
    formattedInitialLogs.map(async (log) => {
      const timestamp = log['@timestamp'];
      const timeEpoch = Date.parse(timestamp);
      const epochDiff = 60 * 10 * 1000;
      const startTime = timeEpoch - epochDiff;
      const endTime = timeEpoch + epochDiff;
      console.log(`startTime  : ${startTime} | endTime : ${endTime}`);
      const finalLogs = await getCloudWatchLogs({
        logGroupName,
        startTime,
        endTime,
        queryString: 'fields @timestamp, @message|sort @timestamp asc',
      });
      const formattedLogs = formatLogs(finalLogs);
      processFormattedLogs(formattedLogs, logMap);
      writeToFile(formattedLogs, `betweenLogs-${count++}.json`);
      console.log('formattedLogs : ', formattedLogs);
    })
  );

  const finalList = [];
  for (var key of Object.keys(logMap)) {
    finalList.push(logMap[key]);
  }
  writeToFile(finalList, 'final.json');
}

async function writeToFile(arr, fileName) {
  var file = fs.createWriteStream(fileName);
  file.on('error', function (err) {
    /* error handling */
    console.log('error ', err);
  });
  arr.forEach(function (v) {
    file.write(JSON.stringify(v) + '\n');
  });
  file.end();
}

function processFormattedLogs(logs, logMap) {
  logs.map((log) => {
    const digest = crypto
      .createHash('sha512')
      .update(`${log['@timestamp']}|${log['@message']}`)
      .digest('base64');
    console.log('digest ', digest);
    if (logMap[digest] != undefined) {
      console.log(`conflict ${digest}`);
    }
    logMap[digest] = log;
  });
}

function formatLogs(logs) {
  const mappedResults = logs.map((r) => {
    const result = {};
    for (const item of r) {
      const field = item.field || '<no name>';
      if (item.field === '@ptr') {
        continue;
      }
      result[field] = item.value || '';
    }
    return result;
  });
  return mappedResults;
}
function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
