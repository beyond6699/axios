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

// 处理 ChangeProjects 中的串行 add 和 move 操作
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

                    // 执行 add 操作
                    const addResponse = await axios.post(`${ProjectAPIUrl}/${changeProject.projectid}/members`, { id: changeProject.projectid, user_id: userResponse.data.id, access_level: 40 }, config);
                    // 检查 add 操作是否成功
                    if (addResponse.status === 200) {
                        console.log('addResponseOK.' + JSON.stringify(addResponse.data));
                        // 如果 add 成功，可以在这里处理后续逻辑
                        var changeProjectsin = [];
                        changeProjectsin.push(changeProject);
                        return processDeleteProjects(changeProjectsin);
                    } else {
                        // 如果 add 失败，返回失败的响应
                        console.log('ADDfailed.' + JSON.stringify(addResponse.data));
                        return { success: false, status: addResponse.status, data: addResponse.data };
                    }
                } catch (error) {
                    // 捕获并返回错误信息
                    console.error('Error in add operation:', error);
                    return { success: false, error: error.message };
                }
            });

            // 等待所有请求完成
            const addResults = await Promise.all(addPromises);
            return addResults; // 返回所有操作的结果

        }else {
            // 如果 add 失败，可以在这里处理错误，例如返回错误信息或抛出异常
            throw new Error('Add operation failed');
        }
    } catch (error) {
        // 处理可能出现的错误
       // console.error('Error processing change project:', error);
        throw error; // 可以重新抛出错误或进行其他错误处理
    }
}

// 处理 DeleteProjects 中的并行 delete 操作
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
        // 首先获取用户id
        const getUserResponse = await axios.get(UserAPIUrl,config);
        if (getUserResponse && getUserResponse.status==200) {
            //如果成功获得id
            console.log('getUserResponseOK.' + JSON.stringify(getUserResponse.data));

            const deletePromises = projects.map((project) => {
                // 返回一个 Promise，不论成功或失败
                return new Promise(async (resolve) => {
                    try {
                        const DeleteResponse = await axios.delete(`${ProjectAPIUrl}/${project.projectid}/members/${getUserResponse.data.id}`, config);
                        console.log('deleteOK:', JSON.stringify(DeleteResponse.data));
                        resolve(DeleteResponse); // 解决 Promise，并返回成功的响应
                    } catch (error) {
                        console.error('deletefailed:', error.response ? error.response.data : error.message);
                        resolve({ success: false, error: error.response ? error.response.data : error.message }); // 解决 Promise，并返回失败的响应
                    }
                });
            });

            const deleteResults = await Promise.all(deletePromises);
            return deleteResults; // 返回所有删除操作的结果
        } else {
            throw new Error('Get User Info Faild！' + JSON.stringify(getUserResponse.data));
        }
    } catch (error) {
        throw error;
    }
}

// 处理所有项目的主函数
async function processAllProjects(ChangeProjects, DeleteProjects) {
    try {
        // 处理 ChangeProjects 的串行 add 和 move 操作
        var changeResults;
        var deleteResults;
        if (ChangeProjects.length > 0) {
            changeResults = await processChangeProject(ChangeProjects);
        }

        // 并行处理 DeleteProjects 的 delete 操作
        if (DeleteProjects.length > 0) {
             deleteResults = await processDeleteProjects(DeleteProjects);
        }

        // 返回所有操作的结果
        return {
            changeResults,
            deleteResults
        };
    } catch (error) {
        // 处理错误
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
                          // 请求已经成功发起，但没有收到响应
                          // `error.request` 在浏览器中是 XMLHttpRequest 的实例，
                          // 而在node.js中是 http.ClientRequest 的实例
                          //console.log(error.request);
                          send404(res);
                      } else {
                          // 发送请求时出了点问题
                          console.log('Error', error.message);
                          send404(res);
                      }
                      console.log(error.config);

                  });
            } catch (error) {
                // 如果解析 JSON 失败或其它错误，发送错误响应
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
          //整理一下数据储存下来
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

          // 处理所有项目，并在完成后发送响应
          processAllProjects(ChangeProjects, DeleteProjects)
              .then((results) => {
                  // 将结果转换为字符串
                 // const resultString = JSON.stringify(results);
                  const resultString = JSON.stringify(results, (key, value) => {
                      // 检测循环引用的逻辑
                      // 假设我们使用一个 WeakSet 来跟踪已经访问过的对象
                      const seen = new WeakSet();

                      if (typeof value === 'object' && value !== null) {
                          if (seen.has(value)) {
                              // 如果对象已经被访问过，表明存在循环引用
                              return undefined; // 返回 undefined 以排除该属性
                          }
                          seen.add(value); // 标记当前对象为已访问
                      }

                      // 对于没有循环引用的对象，返回原始值
                      return value;
                  });

                  console.log('log:processAllProjectsDone:', resultString);
                  // 设置响应头
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  // 发送响应数据
                  res.end(resultString);
                //  console.log('Results of all projects sent:', results);
              })
              .catch((error) => {
                  // 发送错误响应
                  console.error('ERROR:processAllProjects:', error.message);
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: false, error: error.message }));
              });

          } catch (error) {
              // 如果解析 JSON 失败或其它错误，发送错误响应
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
