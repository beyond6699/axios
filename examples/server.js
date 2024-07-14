import fs from 'fs';
import path from 'path';
import http from 'http';
import minimist from 'minimist';
import url from "url";
import axios from 'axios';
const argv = minimist(process.argv.slice(2));
let server;
let dirs;

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function listDirs(root) {
  const files = fs.readdirSync(root);
  const dirs = [];

  for (let i = 0, l = files.length; i < l; i++) {
    const file = files[i];
    if (file[0] !== '.') {
      const stat = fs.statSync(path.join(root, file));
      if (stat.isDirectory()) {
        dirs.push(file);
      }
    }
  }

  return dirs;
}

function getIndexTemplate() {
  const links = dirs.map(function (dir) {
    const url = '/' + dir;
    return '<li onclick="document.location=\'' + url + '\'"><a href="' + url + '">' + url + '</a></li>';
  });

  return (
    '<!doctype html>' +
    '<html>' +
    '<head>' +
    '<title>axios examples</title>' +
    '<style>' +
    'body {padding:25px;}' +
    'ul {margin:0; padding:0; list-style:none;}' +
    'li {padding:5px 10px;}' +
    'li:hover {background:#eee; cursor:pointer;}' +
    'a {text-decoration:none; color:#0080ff;}' +
    '</style>' +
    '<body>' +
    '<ul>' +
    links.join('') +
    '</ul>'
  );
}

function sendResponse(res, statusCode, body) {
  res.writeHead(statusCode);
  res.write(body);
  res.end();
}

function send200(res, body) {
  sendResponse(res, 200, body || '<h1>OK</h1>');
}

function send404(res, body) {
  sendResponse(res, 404, body || '<h1>Not Found</h1>');
}

function pipeFileToResponse(res, file, type) {
  if (type) {
    res.writeHead(200, {
      'Content-Type': type
    });
  }
  fs.createReadStream(path.join(__dirname, file)).pipe(res);
}

// ���� ChangeProjects �еĴ��� add �� move ����
async function processChangeProject(changeProjects) {
    try {

        const UsersAPIUrl = 'http://git.code.tencent.com/api/v3/users';
        const UserAPIUrl = 'http://git.code.tencent.com/api/v3/user';
        const ProjectAPIUrl = 'http://git.code.tencent.com/api/v3/projects';

        const config = {
            headers: {
                'PRIVATE-TOKEN': changeProjects[0].Private_Key,
                'Content-Type': 'application/json',
            }
        };
        const userResponse = await axios.get(`${UsersAPIUrl}/${changeProjects[0].transformid}`, config);
        if (userResponse && userResponse.status==200) {
            console.log('GetuserIDOK.' + JSON.stringify(userResponse.data));

            const addPromises = changeProjects.map(async (changeProject) => {
                try {
                    console.log('addPromisesURL:::.' + `${ProjectAPIUrl}/${changeProject.projectid}/members`);
                    console.log('addPromisespost:::.' + JSON.stringify({ id: changeProject.projectid, user_id: userResponse.data.id, access_level: 40 }));

                    // ִ�� add ����
                    const addResponse = await axios.post(`${ProjectAPIUrl}/${changeProject.projectid}/members`, { id: changeProject.projectid, user_id: userResponse.data.id, access_level: 40 }, config);
                    // ��� add �����Ƿ�ɹ�
                    if (addResponse.status === 200) {
                        console.log('addResponseOK.' + JSON.stringify(addResponse.data));
                        // ��� add �ɹ������������ﴦ������߼�
                        var changeProjectsin = [];
                        changeProjectsin.push(changeProject);
                        return processDeleteProjects(changeProjectsin);
                    } else {
                        // ��� add ʧ�ܣ�����ʧ�ܵ���Ӧ
                        console.log('ADDfailed.' + JSON.stringify(addResponse.data));
                        return { success: false, status: addResponse.status, data: addResponse.data };
                    }
                } catch (error) {
                    // ���񲢷��ش�����Ϣ
                    console.error('Error in add operation:', error);
                    return { success: false, error: error.message };
                }
            });

            // �ȴ������������
            const addResults = await Promise.all(addPromises);
            return addResults; // �������в����Ľ��

        }else {
            // ��� add ʧ�ܣ����������ﴦ��������緵�ش�����Ϣ���׳��쳣
            throw new Error('Add operation failed');
        }
    } catch (error) {
        // ������ܳ��ֵĴ���
       // console.error('Error processing change project:', error);
        throw error; // ���������׳�������������������
    }
}

// ���� DeleteProjects �еĲ��� delete ����
async function processDeleteProjects(projects) {
    try {
        const UserAPIUrl = 'http://git.code.tencent.com/api/v3/user';
        const ProjectAPIUrl = 'http://git.code.tencent.com/api/v3/projects';

        const config = {
            headers: {
                'PRIVATE-TOKEN': projects[0].Private_Key, 
                'Content-Type':'application/json',
            }
        };
        // ���Ȼ�ȡ�û�id
        const getUserResponse = await axios.get(UserAPIUrl,config);
        if (getUserResponse && getUserResponse.status==200) {
            //����ɹ����id
            console.log('getUserResponseOK.' + JSON.stringify(getUserResponse.data));

            const deletePromises = projects.map((project) => {
                // ����һ�� Promise�����۳ɹ���ʧ��
                return new Promise(async (resolve) => {
                    try {
                        const DeleteResponse = await axios.delete(`${ProjectAPIUrl}/${project.projectid}/members/${getUserResponse.data.id}`, config);
                        console.log('deleteOK:', JSON.stringify(DeleteResponse.data));
                        resolve(DeleteResponse); // ��� Promise�������سɹ�����Ӧ
                    } catch (error) {
                        console.error('deletefailed:', error.response ? error.response.data : error.message);
                        resolve({ success: false, error: error.response ? error.response.data : error.message }); // ��� Promise��������ʧ�ܵ���Ӧ
                    }
                });
            });

            const deleteResults = await Promise.all(deletePromises);
            return deleteResults; // ��������ɾ�������Ľ��
        } else {
            throw new Error('Get User Info Faild��' + JSON.stringify(getUserResponse.data));
        }
    } catch (error) {
        throw error;
    }
}

// ����������Ŀ��������
async function processAllProjects(ChangeProjects, DeleteProjects) {
    try {
        // ���� ChangeProjects �Ĵ��� add �� move ����
        var changeResults;
        var deleteResults;
        if (ChangeProjects.length > 0) {
            changeResults = await processChangeProject(ChangeProjects);
        }

        // ���д��� DeleteProjects �� delete ����
        if (DeleteProjects.length > 0) {
             deleteResults = await processDeleteProjects(DeleteProjects);
        }

        // �������в����Ľ��
        return {
            changeResults,
            deleteResults
        };
    } catch (error) {
        // �������
      //  console.error('Error processing all projects:', error);
        throw error;
    }
}




dirs = listDirs(__dirname);

server = http.createServer(function (req, res) {
  let url = req.url;


  // Process axios itself
  if (/axios\.min\.js$/.test(url)) {
    pipeFileToResponse(res, '../dist/axios.min.js', 'text/javascript');
    return;
  }
  if (/axios\.min\.map$/.test(url)) {
    pipeFileToResponse(res, '../dist/axios.min.map', 'text/javascript');
    return;
  }
  if (/axios\.amd\.min\.js$/.test(url)) {
    pipeFileToResponse(res, '../dist/axios.amd.min.js', 'text/javascript');
    return;
  }
  if (/axios\.amd\.min\.map$/.test(url)) {
    pipeFileToResponse(res, '../dist/axios.amd.min.map', 'text/javascript');
    return;
  }

  // Process /
  if (url === '/' || url === '/index.html') {
    send200(res, getIndexTemplate());
    return;
  }

  // Format request */ -> */index.html
  if (/\/$/.test(url)) {
    url += 'index.html';
  }

  // Format request /get -> /get/index.html
  const parts = url.split('/');
  if (dirs.indexOf(parts[parts.length - 1]) > -1) {
    url += '/index.html';
  }

  // Process index.html request
  if (/index\.html$/.test(url)) {
    if (fs.existsSync(path.join(__dirname, url))) {
      pipeFileToResponse(res, url, 'text/html');
    } else {
      send404(res);
    }
  }

  // Process server request
  else if (url =='/post/server') {


        let data = '';
        req.on('data', function (chunk) {
            data += chunk;
        });
        req.on('end', function () {

            try {
              console.log('POST data received' + data);

              var jsonobj = JSON.parse(data);
              var MyPrivate_Key = jsonobj.Private_Key;


              const instance = axios.create({
                  baseURL: 'http://git.code.tencent.com/api/v3/',
                  timeout: 1000,
                  headers: { 'PRIVATE-TOKEN': MyPrivate_Key }
              });


              instance.get('/projects')
                  .then(function (res2) {

                      console.log('sender data::' + JSON.stringify( res2.data));
                      res.writeHead(res2.status, {
                          'Content-Type': 'text/json'
                      });
                      res.write(JSON.stringify(res2.data));
                      res.end();

                  })
                  .catch(function (error) {

                      if (error.response) {


                          res.writeHead(error.response.status, error.response.headers);
                          res.write(JSON.stringify(error.response.data));
                          res.end();

                      } else if (error.request) {
                          // �����Ѿ��ɹ����𣬵�û���յ���Ӧ
                          // `error.request` ����������� XMLHttpRequest ��ʵ����
                          // ����node.js���� http.ClientRequest ��ʵ��
                          //console.log(error.request);
                          send404(res);
                      } else {
                          // ��������ʱ���˵�����
                          console.log('Error', error.message);
                          send404(res);
                      }
                      console.log(error.config);

                  });
            } catch (error) {
                // ������� JSON ʧ�ܻ��������󣬷��ʹ�����Ӧ
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: error.message }));
                console.error('Error parsing JSON or processing data:', error);
            }
        });
  } else if (url == '/transform/server') {



      let data = '';
      req.on('data', function (chunk) {
          data += chunk;
      });
      req.on('end', function () {


          try {
          console.log('POST data received' + data);

          var jsonobj = JSON.parse(data);
          var MyPrivate_Key = jsonobj.Private_Key;
          var slelectinf = jsonobj.slelectinf;
          var transformid = jsonobj.transformid;
          var ChangeProjects = [];
          var DeleteProjects = [];
          //����һ�����ݴ�������
          slelectinf.forEach(function (porject) {

              var parts = porject.id.split('__RadioSelect__');
              var SaveInfo = {};
              SaveInfo.id = parts[0];
              SaveInfo.index = parts[1];
              SaveInfo.projectid = parts[2];
              SaveInfo.Private_Key = MyPrivate_Key;
              SaveInfo.transformid = transformid;
              if (porject.checked == true && parts[1] == 3) {
                  ChangeProjects.push(SaveInfo);
              } else if (porject.checked == true && parts[1] == 1) {
                  DeleteProjects.push(SaveInfo);
              }
          });
          console.log('ChangeProjects : ' + ChangeProjects.length);
          console.log('DeleteProjects : ' + DeleteProjects.length);

          // ����������Ŀ��������ɺ�����Ӧ
          processAllProjects(ChangeProjects, DeleteProjects)
              .then((results) => {
                  // �����ת��Ϊ�ַ���
                 // const resultString = JSON.stringify(results);
                  const resultString = JSON.stringify(results, (key, value) => {
                      // ���ѭ�����õ��߼�
                      // ��������ʹ��һ�� WeakSet �������Ѿ����ʹ��Ķ���
                      const seen = new WeakSet();

                      if (typeof value === 'object' && value !== null) {
                          if (seen.has(value)) {
                              // ��������Ѿ������ʹ�����������ѭ������
                              return undefined; // ���� undefined ���ų�������
                          }
                          seen.add(value); // ��ǵ�ǰ����Ϊ�ѷ���
                      }

                      // ����û��ѭ�����õĶ��󣬷���ԭʼֵ
                      return value;
                  });

                  console.log('log:processAllProjectsDone:', resultString);
                  // ������Ӧͷ
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  // ������Ӧ����
                  res.end(resultString);
                //  console.log('Results of all projects sent:', results);
              })
              .catch((error) => {
                  // ���ʹ�����Ӧ
                  console.error('ERROR:processAllProjects:', error.message);
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: false, error: error.message }));
              });

          } catch (error) {
              // ������� JSON ʧ�ܻ��������󣬷��ʹ�����Ӧ
              console.error('Error parsing JSON or processing data:', error.message);
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: error.message }));
          }

      });
  } else {
    send404(res);
  }
});

const PORT = argv.p || 3000;

server.listen(PORT, () => {
  console.log(`Examples running on ${PORT}`);
});
