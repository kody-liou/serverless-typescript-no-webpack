// # sourceMappingURL=hello.js.map
require('dotenv').config();

import httpErrorHandler from '@middy/http-error-handler';
import middy from '@middy/core';
import type { APIGatewayProxyResult } from 'aws-lambda';

export default middy(async (): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    body: 'hello',
  };
}).use(httpErrorHandler());
