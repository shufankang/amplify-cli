const opn = require('opn');
const chalk = require('chalk');
const remoteUrl = require('remote-origin-url');
const branchName = require('git-branch');
const regionMapping = require('./region-mapping');

const serviceName = 'AWSAmplifyHosting';
const providerName = 'Please create the resource in AWS console.';
const consoleServiceName = 'amplify';
const serviceRole = 'AmplifyServiceRole';
const categoryName = 'hosting';

async function add(context) {
  context.deploy = {};
  await setupIamClient(context);
  const roleArn = await getServiceRole(context);
  const region = regionMapping.getRegion(context);
  const parameters = {
    serviceRoleArn: roleArn,
  };
  const metaData = {
    service: serviceName,
    providerPlugin: providerName,
    region,
  };
  context.amplify.updateamplifyMetaAfterResourceAdd(
    categoryName,
    serviceName,
    metaData,
  );
  context.deploy.parameters = parameters;
  await openConsoleCreateFlow(context);
  context.print.info('Please follow the link opened to create your AWS Amplify Deploy App.');
}

async function configure(context) {
  context.print.info(chalk.blue('You can configure your AWS Amplify Deploy using AWS console.'));
  await console(context);
}

function publish(context) {
  context.print.info(chalk.blue('You have already configured to use AWS Amplify Deploy, please run \n \'git push\' \n to publish your website.'));
}

function console(context) {
  const amplifyMeta = context.amplify.getProjectMeta();
  const {
    region,
  } =
  amplifyMeta[categoryName][serviceName];
  const consoleUrl =
    `https://${region}.console.aws.amazon.com/${consoleServiceName}/home?#/`;
  context.print.info(chalk.green(consoleUrl));
  opn(consoleUrl, {
    wait: false,
  });
}

async function setupIamClient(context) {
  const { projectConfig } = context.amplify.getProjectDetails();
  const provider = require(projectConfig.providers.awscloudformation);
  const aws = await provider.getConfiguredAWSClient(context);
  context.deploy.iam = new aws.IAM();
}

async function getServiceRole(context) {
  try {
    const result = await context.deploy.iam.getRole({
      RoleName: serviceRole,
    }).promise();
    return result.Role.Arn;
  } catch (err) {
    return 'NONE';
  }
}

function getRepoUrl(context) {
  try {
    return remoteUrl.sync();
  } catch (err) {
    context.print.err(chalk.red(err.stack));
  }
}

async function openConsoleCreateFlow(context) {
  const {
    region,
  } = context.amplify.getProjectMeta().hosting[serviceName];
  const roleArn = await getServiceRole(context);
  const repoUrl = getRepoUrl(context);
  const branch = await branchName();
  const consoleUrl = `https://${region}.console.aws.amazon.com/${consoleServiceName}/home?#/create?repo=${repoUrl}&branch=${branch}&roleArn=${roleArn}`; // TODO: update when console is ready
  context.print.info(chalk.green(consoleUrl));
  opn(consoleUrl, {
    wait: false,
  });
}

module.exports = {
  add,
  configure,
  publish,
  console,
};
