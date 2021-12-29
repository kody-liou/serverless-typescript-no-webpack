import axios, { AxiosRequestConfig } from 'axios';
import fs from 'fs';
import path from 'path';

const API_BASE_URL = `http://localhost:${process.env.PORT || 7070}`;

describe('file', () => {
  jest.setTimeout(30000000);
  let uploadUrl: string;
  it('get put file url', async () => {
    const response1 = await axios.put(
      `${API_BASE_URL}/files/signed-url`,
      null,
      {
        params: { fileName: 'testFile2xxxx', fileExt: 'jpg' },
      },
    );
    expect(response1.status).toEqual(200);
    expect(response1.data).toMatch(/https:\//);
    uploadUrl = response1.data as string;
  });

  it('upload file', async () => {
    const filePath = path.resolve(__dirname, '../assets/IMG20201004134009.jpg');
    const buffer = fs.readFileSync(filePath);
    const config: AxiosRequestConfig<Buffer> = {
      method: 'put',
      url: uploadUrl,
      headers: {
        'Content-Type': 'image/jpeg',
      },
      data: buffer,
    };
    const response2 = await axios(config);
    expect(response2.status).toEqual(200);
  });
  let downloadUrl: string;
  it('get download file url', async () => {
    const res = await axios.get(`${API_BASE_URL}/files/signed-url`, {
      params: { fileName: 'testFile2xxxx', fileExt: 'jpg' },
    });
    expect(res.status).toEqual(200);
    expect(res.data).toMatch(/https:\//);
    downloadUrl = res.data;
  });

  it('download file', async () => {
    const res = await axios.get(downloadUrl);
    expect(res.status).toEqual(200);
  });

  it('list file', async () => {
    const res = await axios.get(
      `${API_BASE_URL}/files/user-uploaded-file-list`,
    );
    expect(res.status).toEqual(200);
  });

  it('remove user folder', async () => {
    const res = await axios.delete(`${API_BASE_URL}/files`);
    expect(res.status).toEqual(204);
  });
});
