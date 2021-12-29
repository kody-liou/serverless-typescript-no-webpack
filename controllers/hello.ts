// # sourceMappingURL=hello.js.map
require('dotenv').config();

import httpErrorHandler from '@middy/http-error-handler';
import middy from '@middy/core';

export default middy(async () => {
  return {
    statusCode: 200,
    body: { a: 1 },
  };
}).use(httpErrorHandler());
