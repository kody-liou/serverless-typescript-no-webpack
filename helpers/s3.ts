import { nanoid } from 'nanoid';
import moment from 'moment-timezone';
import {
  S3Client,
  ListObjectsCommand,
  ListObjectsCommandInput,
  DeleteObjectCommand,
  DeleteObjectCommandInput,
  GetObjectCommand,
  GetObjectCommandInput,
  PutObjectCommand,
  PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl as getS3SignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({ region: process.env.REGION });

export type S3FileData = {
  lastModified: number;
  id: string;
  fileExt: string;
  size?: number;
};

export const listObjects = async (s3Folder: string): Promise<S3FileData[]> => {
  const params: ListObjectsCommandInput = {
    Bucket: process.env.AWS_BUCKET_NAME!,
    Delimiter: '/',
    Prefix: `${s3Folder}/`,
  };
  const data = await s3.send(new ListObjectsCommand(params));
  if (!data.Contents) return [];
  const fileList: S3FileData[] = [];
  for (let index = 0; index < data.Contents.length; index += 1) {
    const content = data.Contents[index];
    const { Size: size } = content;
    const splitedKey: string[] | undefined = content.Key?.split('/');
    const lastModified = moment(content.LastModified).unix();
    const fileFullName =
      (splitedKey && splitedKey[splitedKey.length - 1]) || '';
    const fileFullNameSplited = fileFullName.split('.');
    if (fileFullNameSplited.length < 2) throw Error('no file ext');
    const fileExt = fileFullNameSplited.pop() as string;
    const id = fileFullNameSplited.join();
    fileList.push({ id, fileExt, lastModified, size });
  }
  return fileList;
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

export const deleteFile = (key: string) => {
  const params: DeleteObjectCommandInput = {
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key,
  };
  return s3.send(new DeleteObjectCommand(params));
};

export const generateGetObjectSignedUrl = async (
  key: string,
): Promise<string> => {
  const params: GetObjectCommandInput = {
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key,
  };
  const command = new GetObjectCommand(params);
  const url = await getS3SignedUrl(s3, command, { expiresIn: 3600 });
  return url;
};

export const generatePutObjectSignedUrl = async (
  key: string,
): Promise<string> => {
  const params: PutObjectCommandInput = {
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key,
  };
  const command = new PutObjectCommand(params);
  const url = await getS3SignedUrl(s3, command, { expiresIn: 3600 });
  return url;
};
