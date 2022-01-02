// # sourceMappingURL=userFiles.js.map
require('dotenv').config();

import middy from '@middy/core';
import httpEventNormalizer from '@middy/http-event-normalizer';
import type { APIGatewayProxyResultV2 } from 'aws-lambda';
import mime from 'mime-types';
import httpErrorHandler from '@middy/http-error-handler';
import { responseSerializer } from '../helpers/middy';
import {
  getUserUploadedFileS3Key,
  generateGetObjectSignedUrl,
  generatePutObjectSignedUrl,
  listObjects as listS3Object,
  deleteFile as deleteS3File,
} from '../helpers/s3';
import * as authenticator from '../middlewares/authenticator';

export const signedUrl = middy(
  async (event: authenticator.Event): Promise<APIGatewayProxyResultV2> => {
    // @ts-ignore:next-line
    const { method } = event.requestContext.http;
    if (!['GET', 'PUT'].includes(method)) {
      return {
        statusCode: 405,
        body: 'Method Not Allowed',
      };
    }
    const { fileName, fileExt } = event.queryStringParameters!;
    if (!fileExt) {
      return {
        statusCode: 400,
        body: 'No fileExt',
      };
    }
    const contentType = mime.lookup(fileExt);
    if (!contentType) {
      return {
        statusCode: 400,
        body: 'Invalid fileExt',
      };
    }
    const key = getUserUploadedFileS3Key(
      event.authedUserId || 'testtest',
      fileExt,
      fileName,
    );
    let uploadUrl: string;
    if (method === 'PUT') {
      uploadUrl = await generatePutObjectSignedUrl(key);
    } else {
      uploadUrl = await generateGetObjectSignedUrl(key);
    }
    return {
      statusCode: 200,
      body: uploadUrl,
    };
  },
)
  .use(httpErrorHandler())
  .use(httpEventNormalizer())
  .use(responseSerializer);
// .use(authenticator.default());

export const deleteFile = middy(
  async (event: authenticator.Event): Promise<APIGatewayProxyResultV2> => {
    const { authedUserId = 'testtest', queryStringParameters } = event;
    const { fileExt, fileId } = queryStringParameters!;
    if (!fileId || !fileExt) {
      return {
        statusCode: 400,
        body: 'No fileId or fileExt',
      };
    }
    const key = getUserUploadedFileS3Key(authedUserId, fileExt, fileId);
    const response = await deleteS3File(key);
    console.log(response);
    return {
      statusCode: 200,
    };
  },
)
  .use(httpErrorHandler())
  .use(httpEventNormalizer())
  .use(responseSerializer);

export const listObjects = middy(
  async (event: authenticator.Event): Promise<APIGatewayProxyResultV2> => {
    const { authedUserId = 'testtest' } = event;
    const fileList = await listS3Object(`user-uploaded/${authedUserId}`);
    return {
      statusCode: 200,
      body: JSON.stringify(fileList),
    };
  },
)
  .use(httpErrorHandler())
  .use(httpEventNormalizer())
  .use(responseSerializer);
// .use(authenticator.default());
