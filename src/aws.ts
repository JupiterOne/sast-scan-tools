import AWS from "aws-sdk";

export default AWS;

export const lambda = new AWS.Lambda({
  apiVersion: "2015-03-31",
});
