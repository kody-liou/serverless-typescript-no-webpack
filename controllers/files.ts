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
  getSignedUrl as getS3SignedUrl,
  listObjects as listS3Object,
  GetSignedUrlOperation,
  deleteFile as deleteS3File,
  rootFolderName,
} from '../helpers/s3';
import * as authenticator from '../middlewares/authenticator';

export const signedUrl = middy(
  async (event: authenticator.Event): Promise<APIGatewayProxyResultV2> => {
    // @ts-ignore:next-line
    const { method } = event.requestContext.http;
    let operation: GetSignedUrlOperation;
    if (method === 'GET') {
      operation = GetSignedUrlOperation.getObject;
    } else if (method === 'PUT') {
      operation = GetSignedUrlOperation.putObject;
    } else {
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
    const uploadUrl = getS3SignedUrl(
      getUserUploadedFileS3Key(
        event.authedUserId || 'testtest',
        fileExt,
        fileName,
      ),
      {
        operation,
        contentType,
        expirationSeconds: 600,
      },
    );
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

export const deleteUserFolder = middy(
  async (event: authenticator.Event): Promise<APIGatewayProxyResultV2> => {
    const response = await deleteS3File(
      `${rootFolderName}/${event.authedUserId || 'testtest'}`,
    ).then(res => res);
    console.log(response);
    return {
      statusCode: response.statusCode,
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
