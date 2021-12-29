import stream from 'stream';
import { nanoid } from 'nanoid';
import axios from 'axios';
import AWS from 'aws-sdk';
import mime from 'mime-types';
import moment from 'moment-timezone';

AWS.config.update({
  region: process.env.REGION,
});
const s3 = new AWS.S3();

export const uploadFromStream = (key: string, fileExt: string) => {
  const pass = new stream.PassThrough();
  return {
    writeStream: pass,
    promise: s3
      .upload({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: key,
        Body: pass,
        ContentType: mime.lookup(fileExt) || undefined,
      })
      .promise(),
  };
};

type FileDataForUser = {
  lastModified: number;
  fileName: string;
  fileExt: string;
};

export const listObjects = async (
  s3Folder: string,
): Promise<FileDataForUser[]> => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME!,
    Delimiter: '/',
    Prefix: `${s3Folder}/`,
  };
  const data = await s3.listObjects(params).promise();
  if (!data.Contents) return [];
  const fileList: FileDataForUser[] = [];
  for (let index = 0; index < data.Contents.length; index += 1) {
    const content = data.Contents[index];
    const splitedKey: string[] | undefined = content.Key?.split('/');
    const lastModified = moment(content.LastModified).unix();
    const fileFullName =
      (splitedKey && splitedKey[splitedKey.length - 1]) || '';
    const fileFullNameSplited = fileFullName.split('.');
    if (fileFullNameSplited.length < 2) throw Error('no file ext');
    const fileExt = fileFullNameSplited.pop() as string;
    const fileName = fileFullNameSplited.join();
    fileList.push({ fileName, fileExt, lastModified });
  }
  return fileList;
};

export const uploadFileFromBuffer = async (
  key: string,
  fileExt: string,
  buffer: Buffer,
) => {
  return s3
    .upload({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: mime.lookup(fileExt) || undefined,
    })
    .promise();
};

export const uploadFileFromNetwork = async (
  key: string,
  fileExt: string,
  readUrl: string,
) => {
  const { writeStream, promise } = uploadFromStream(key, fileExt);
  const response = await axios({
    method: 'get',
    url: readUrl,
    responseType: 'stream',
  });
  response.data.pipe(writeStream);
  return promise;
};

export enum S3ResourceType {
  image = 'image',
  report = 'report',
}

export const getSystemGeneratedFileS3Key = (
  resourceType: S3ResourceType,
  fileExt: string,
  id?: string,
): string => {
  return `system-generated/${resourceType}/${id || nanoid()}.${fileExt}`;
};

export const rootFolderName = 'user-uploaded';

/** 獲得檔案的 key */
export const getUserUploadedFileS3Key = (
  userId: string,
  fileExt: string,
  fileId?: string,
) => {
  return `${rootFolderName}/${userId}/${fileId || nanoid()}.${fileExt}`;
};

export const downloadFile = async (key: string) => {
  const params: AWS.S3.GetObjectRequest = {
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key,
  };
  const { Body } = await s3.getObject(params).promise();
  return Body;
};

export const deleteFile = (key: string) => {
  const params: AWS.S3.DeleteObjectRequest = {
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key,
  };
  return s3.deleteObject(params).promise();
};

export enum GetSignedUrlOperation {
  getObject = 'getObject',
  putObject = 'putObject',
}

// Change this value to adjust the signed URL's expiration
const URL_EXPIRATION_SECONDS = 300;

export type GetSignedUrlOptions = {
  operation?: GetSignedUrlOperation | string;
  contentType?: string;
  expirationSeconds?: number;
};

export const getSignedUrl = (
  key: string,
  { operation, contentType: type, expirationSeconds }: GetSignedUrlOptions = {},
) => {
  const contentType =
    operation === GetSignedUrlOperation.putObject ? type : undefined;
  return s3.getSignedUrl(operation || GetSignedUrlOperation.getObject, {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Expires: expirationSeconds || URL_EXPIRATION_SECONDS,
    ContentType: contentType,
  });
};
