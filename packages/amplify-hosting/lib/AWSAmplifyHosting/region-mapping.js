
function getRegion(context) {
  const region = context.amplify.getProjectMeta().providers.awscloudformation.Region;
  switch (region) {
    case 'us-east-1':
    case 'us-east-2':
      return 'us-east-1';
    case 'us-west-1':
    case 'us-west-2':
      return 'us-west-2';
    // TODO add more region mappings.
    default:
      return 'us-west-2';
  }
}

module.exports = {
  getRegion,
};
