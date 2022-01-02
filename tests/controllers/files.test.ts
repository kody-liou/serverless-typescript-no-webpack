import axios, { AxiosRequestConfig } from 'axios';
import fs from 'fs';
import path from 'path';

describe('file', () => {
  jest.setTimeout(30000000);
  let uploadUrl: string;
  const fileId = 'test-image';
  const fileExt = 'jpg';
  it('get put file url', async () => {
    const response1 = await axios.put(
      `${process.env.API_BASE_URL}/files/signed-url`,
      null,
      {
        params: { fileName: fileId, fileExt },
      },
    );
    expect(response1.status).toEqual(200);
    expect(response1.data).toMatch(/https:\//);
    uploadUrl = response1.data as string;
  });

  it('upload file', async () => {
    const filePath = path.resolve(
      __dirname,
      '../assets/taipei_fine_arts_museum.jpg',
    );
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
    const res = await axios.get(
      `${process.env.API_BASE_URL}/files/signed-url`,
      {
        params: { fileName: fileId, fileExt },
      },
    );
    expect(res.status).toEqual(200);
    expect(res.data).toMatch(/https:\//);
    downloadUrl = res.data;
  });

  it('download file', async () => {
    const res = await axios.get(downloadUrl);
    expect(res.status).toEqual(200);
  });

  it('list file', async () => {
    const res = await axios.get(`${process.env.API_BASE_URL}/files/list`);
    expect(JSON.parse(res.data).length).toEqual(1);
    expect(res.status).toEqual(200);
  });

  it('delete file', async () => {
    const res = await axios.delete(`${process.env.API_BASE_URL}/files`, {
      params: { fileId, fileExt },
    });
    expect(res.status).toEqual(204);
  });

  it('list file', async () => {
    const res = await axios.get(`${process.env.API_BASE_URL}/files/list`);
    expect(JSON.parse(res.data).length).toEqual(0);
    expect(res.status).toEqual(200);
  });
});
