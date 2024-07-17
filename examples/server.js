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



async function getProjects(Private_Key,page,per_page) {
    const projectsAPIUrl = 'https://git.code.tencent.com/api/v3/projects';

    var out = [];
    const config = {
        headers: {
            'PRIVATE-TOKEN': Private_Key,
            'Content-Type': 'application/json',
        }
    };
    
    const Response = await axios.get(`${projectsAPIUrl}/?page=${page}&per_page=${per_page}`, config);
    if (Response && Response.status === 200) {
        //console.log('gprojectsResponseOK.' + JSON.stringify(Response.data));
        out = Response.data;
    } else {
        console.log('projectsResponsefalse.' + JSON.stringify(Response.data));

    }
    return out;
}
async function getAllProjects(Private_Key) {
 
    let page = 1; // 从第一页开始
    let allData = []; // 存储所有数据的数组
    while (true) {
        const response = await getProjects(Private_Key,page, 100); 
        allData = allData.concat(response); 
        if ( response.length<100) {
            break;
        }
        page++;
    }
    return allData;
}


async function getProjectMembers(Private_Key, projectid, page, per_page) {
    const projectsAPIUrl = 'https://git.code.tencent.com/api/v3/projects';

    var out = [];
    const config = {
        headers: {
            'PRIVATE-TOKEN': Private_Key,
            'Content-Type': 'application/json',
        }
    };
    const Response = await axios.get(`${projectsAPIUrl}/${projectid}/members?page=${page}&per_page=${per_page}`, config);
    if (Response && Response.status === 200) {
        //console.log('gprojectsResponseOK.' + JSON.stringify(Response.data));
        out = Response.data;
    } else {
        console.log('projectsResponsefalse.' + JSON.stringify(Response.data));

    }
    return out;
}
async function getAllProjectsMembers(Private_Key, projectid) {

    let page = 1; // 从第一页开始
    let allData = []; // 存储所有数据的数组
    while (true) {
        const response = await getProjectMembers(Private_Key, projectid, page, 100);
        allData = allData.concat(response);
        if (response.length < 100) {
            break;
        }
        page++;
    }
    return allData;
}

//async function getGroupOwned(Private_Key) {
//    const groupsAPIUrl = 'https://git.code.tencent.com/api/v3/groups/Owned';

//    var out = [];
//    const config = {
//        headers: {
//            'PRIVATE-TOKEN': Private_Key,
//            'Content-Type': 'application/json',
//        }
//    };
//    const Response = await axios.get(groupsAPIUrl, config);
//    if (Response && Response.status === 200) {
//        //console.log('getGroupOwnedOK.' + JSON.stringify(Response.data));
//        out = Response.data;
//    } else {
//        console.log('getGroupOwnedfalse.' + JSON.stringify(Response.data));

//    }
//    return out;
//}

//async function getUserInfo(Private_Key, UserID) {
//    const APIUrl = 'https://git.code.tencent.com/api/v3/users';
//    var out = {
//        success: false,
//        message: '',
//        data: {}
//    };
//    const config = {
//        headers: {
//            'PRIVATE-TOKEN': Private_Key,
//            'Content-Type': 'application/json',
//        }
//    };

//    const Response = await await axios.get(`${APIUrl}/${UserID}`, config)
//    if (Response && Response.status === 200) {
//        out.success = true;
//        out.data = Response.data;
//    } else {
//        out.success = true;
//        out.message = JSON.stringify(Response.data);
//        console.log('getUserInfo. failed' + JSON.stringify(out.message));
//    }
//    return out;
//}







async function getGroups(Private_Key, page, per_page) {
    const groupsAPIUrl = 'https://git.code.tencent.com/api/v3/groups';

    var out = [];
    const config = {
        headers: {
            'PRIVATE-TOKEN': Private_Key,
            'Content-Type': 'application/json',
        }
    };

    const Response = await axios.get(`${groupsAPIUrl}/?page=${page}&per_page=${per_page}`, config);
    if (Response&&Response.status === 200) {
        //console.log('groupsResponseOK.' + JSON.stringify(Response.data));
        out =Response.data;
    } else {
        console.log('groupsResponsefalse.' + JSON.stringify(Response.data));

    }
    return out;
}
async function getAllGroups(Private_Key) {

    let page = 1; // 从第一页开始
    let allData = []; // 存储所有数据的数组
    while (true) {
        const response = await getGroups(Private_Key, page, 100);
        allData = allData.concat(response);
        if (response.length < 100) {
            break;
        }
        page++;
    }
    return allData;
}

async function getselfUser(Private_Key) {
    const groupsAPIUrl = 'https://git.code.tencent.com/api/v3/user';

    var out = {};
    const config = {
        headers: {
            'PRIVATE-TOKEN': Private_Key,
            'Content-Type': 'application/json',
        }
    };
    const Response = await axios.get(`${groupsAPIUrl}`, config);
    if (Response && Response.status === 200) {
      //  console.log('getselfUsersOK.' + JSON.stringify(Response.data));
        out = Response.data;
    } else {
        console.log('getselfUserfalse.' + JSON.stringify(Response.data));

    }
    return out;
}

async function getOtherUser(Private_Key,username) {
    const APIUrl = 'https://git.code.tencent.com/api/v3/users';

    var out = {};
    const config = {
        headers: {
            'PRIVATE-TOKEN': Private_Key,
            'Content-Type': 'application/json',
        }
    };
    const Response = await axios.get(`${APIUrl}/${username}`,config);
    if (Response && Response.status === 200) {
        //  console.log('getselfUsersOK.' + JSON.stringify(Response.data));
        out = Response.data;
    } else {
        console.log('getOtherUser.' + JSON.stringify(Response.data));
    }
    return out;
}
async function getGroupMembers(Private_Key, Groupid,page, per_page) {
    const groupsAPIUrl = 'https://git.code.tencent.com/api/v3/groups';

    var out = [];
    const config = {
        headers: {
            'PRIVATE-TOKEN': Private_Key,
            'Content-Type': 'application/json',
        }
    };
    const Response = await axios.get(`${groupsAPIUrl}/${Groupid}/members?page=${page}&per_page=${per_page}`, config);
    if (Response && Response.status === 200) {
       // console.log('getGroupMembersOK.' + JSON.stringify(Response.data));
        out = Response.data;
    } else {
        console.log('getGroupMembersfalse.' + JSON.stringify(Response.data));

    }
    return out;
}

async function getAllGroupMembers(Private_Key, Groupid) {

    let page = 1; // 从第一页开始
    let allData = []; // 存储所有数据的数组
    while (true) {
        const response = await getGroupMembers(Private_Key, Groupid, page, 100);
        allData = allData.concat(response);
        if (response.length < 100) {
            break;
        }
        page++;
    }
    return allData;
}


async function getMasterGroups(MyPrivate_Key, checkid) {
    var groups = await getAllGroups(MyPrivate_Key);
    var SelectGroups = [];

    console.log('------------------groups-------------------' + groups.length);

    // 创建一个包含所有组成员检查 Promise 的数组
    const groupChecks = groups.map(group => (
        // 对每个组，获取其成员列表
        getAllGroupMembers(MyPrivate_Key, group.id).then(members => {
            for (const member of members) {
                if (member.id == checkid) {
                    SelectGroups.push(group);
                    console.log('------------------group-------------------' + group.full_path);
                }
            };
        })
    ));

    // 等待所有组成员检查完成
    await Promise.all(groupChecks);

    console.log('------------------SelectGroupsLength-------------------' + SelectGroups.length);
    return SelectGroups;
}


async function getMasterProjects(MyPrivate_Key,checkid) {
    // 首先获取所有项目
    var Projects = await getAllProjects(MyPrivate_Key);
    console.log('------------------Projects-------------------' + Projects.length);

    // 过滤出包含当前用户作为成员的项目
    const SelectProjects = [];
    const projectPromises = Projects.map(Project => (
        getAllProjectsMembers(MyPrivate_Key, Project.id).then(members => {
            for (const member of members) {
                if (member.id ==  checkid) {
                    SelectProjects.push(Project);
                    console.log('------------------Project-------------------' + Project.name_with_namespace);
                }
            };
        })
    ));
    // 等待所有项目成员的检查完成
    await Promise.all(projectPromises);

    console.log('------------------SelectProjects-------------------' + SelectProjects.length);
    return SelectProjects;
}
async function getMasterAllinfo(MyPrivate_Key, checkid) {
    const Groups = await getMasterGroups(MyPrivate_Key, checkid);
    const projects = await getMasterProjects(MyPrivate_Key, checkid);
    return{ AllGroups: Groups, AllProjects: projects };
}
async function getMasterAll(MyPrivate_Key) {
    var selfUser = await getselfUser(MyPrivate_Key)
    return getMasterAllinfo(MyPrivate_Key, selfUser.id);
}




// 处理 ChangeProjects 中的串行 add 和 move 操作
async function processChangeProject(changeProjects) {
    try {

        const UsersAPIUrl = 'https://git.code.tencent.com/api/v3/users';
        const ProjectAPIUrl = 'https://git.code.tencent.com/api/v3/projects';

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
                        let changeProjectsin = [];
                        changeProjectsin.push(changeProject);
                        return await processDeleteProjects(changeProjectsin);
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
            return addResults.flat(); // 返回所有操作的结果

        }else {
            // 捕获并返回错误信息
            console.error('processChangeProject1:', error.response ? error.response.data : error.message);
            return [{ success: false, error: error.response ? error.response.data : error.message }]; // 解决 Promise，并返回失败的响应
        }
    } catch (error) {
        // 捕获并返回错误信息
        console.error('processChangeProject2:', error.response ? error.response.data : error.message);
        return [{ success: false, error: error.response ? error.response.data : error.message }]; // 解决 Promise，并返回失败的响应
    }
}

// 处理 DeleteProjects 中的并行 delete 操作
async function processDeleteProjects(projects) {
    try {
        const UserAPIUrl = 'https://git.code.tencent.com/api/v3/user';
        const ProjectAPIUrl = 'https://git.code.tencent.com/api/v3/projects';

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
                        console.log('deleteOK:');
                        resolve({ success: true, error: ''}); // 解决 Promise，并返回成功的响应
                    } catch (error) {
                        console.error('deletefailed:', error.response ? error.response.data : error.message);
                        resolve({ success: false, error: error.response ? error.response.data : error.message }); 
                    }
                });
            });

            const deleteResults = await Promise.all(deletePromises);
            return deleteResults; // 返回所有删除操作的结果
        } else {
            // 捕获并返回错误信息
            console.error('Get User Info Faild:', JSON.stringify(getUserResponse.data));
            return [{ success: false, error: JSON.stringify(getUserResponse.data) }]; 
        }
    } catch (error) {
        // 捕获并返回错误信息
        console.error('processDeleteProjects:', error.response ? error.response.data : error.message);
        return [{ success: false, error: error.response ? error.response.data : error.message }]; 
    }
}




// 处理 ChangeProjects 中的串行 add 和 move 操作
async function processChangeGroup(changeGroups) {
    try {

        const UsersAPIUrl = 'https://git.code.tencent.com/api/v3/users';
        const UserAPIUrl = 'https://git.code.tencent.com/api/v3/user';
        const groupsAPIUrl = 'https://git.code.tencent.com/api/v3/groups';

        const config = {
            headers: {
                'PRIVATE-TOKEN': changeGroups[0].Private_Key,
                'Content-Type': 'application/json',
            }
        };
        const userResponse = await axios.get(`${UsersAPIUrl}/${changeGroups[0].transformid}`, config);
        if (userResponse && userResponse.status == 200) {
            console.log('GetuserIDOK.' + JSON.stringify(userResponse.data));

            const addPromises = changeGroups.map(async (changeGroup) => {

                try {
                    console.log('addPromisesURL:::.' + `${groupsAPIUrl}/${changeGroup.projectid}/members`);
                    console.log('addPromisespost:::.' + JSON.stringify({ id: changeGroup.projectid, user_id: userResponse.data.id, access_level: 50 }));

                    // 执行 add 操作
                    const addResponse = await axios.post(`${groupsAPIUrl}/${changeGroup.projectid}/members`, { id: changeGroup.projectid, user_id: userResponse.data.id, access_level: 50 }, config)
                    console.log('addResponse.' + JSON.stringify(addResponse.data));
                    const deleteResults = await processDeleteGroups([changeGroup]);
                    return deleteResults;
                      
                } catch (error) {
                    if (error.response.status == 409) {
                        // 如果 已经添加过 409 错误 可以在这里处理后续逻辑
                        const deleteResults = await processDeleteGroups([changeGroup]);
                        return deleteResults;
                    } else {
                        // 捕获并返回错误信息
                        console.error('addPromises:', error.response ? error.response.data : error.message);
                        return{ success: false, error: error.response ? error.response.data : error.message }; // 解决 Promise，并返回失败的响应
                    }
                }
            });

            // 等待所有请求完成
            const addResults = await Promise.all(addPromises);
            return addResults.flat(); // 返回所有操作的结果

        } else {

            // 捕获并返回错误信息
            console.error('processChangeGroup1:', error.response ? error.response.data : error.message);
            return [{ success: false, error: error.response ? error.response.data : error.message }]; // 解决 Promise，并返回失败的响应
        }
    } catch (error) {
        // 捕获并返回错误信息
        console.error('processChangeGroup2:', error.response ? error.response.data : error.message);
        return [{ success: false, error: error.response ? error.response.data : error.message }]; // 解决 Promise，并返回失败的响应
    }
}


// 处理 DeleteGroups 中的并行 delete 操作
async function processDeleteGroups(Groups) {
    try {
        const UserAPIUrl = 'https://git.code.tencent.com/api/v3/user';
        const ProjectAPIUrl = 'https://git.code.tencent.com/api/v3/groups';

        const config = {
            headers: {
                'PRIVATE-TOKEN': Groups[0].Private_Key,
                'Content-Type': 'application/json',
            }
        };
        // 首先获取用户id
        console.log('processDeleteGroups1111111111.');

        const getUserResponse = await axios.get(UserAPIUrl, config);
        if (getUserResponse && getUserResponse.status == 200) {
            //如果成功获得id
            console.log('getUserResponseOK.' + JSON.stringify(getUserResponse.data));

            const deletePromises = Groups.map((Group) => {
                // 返回一个 Promise，不论成功或失败
                return new Promise(async (resolve) => {
                await axios.delete(`${ProjectAPIUrl}/${Group.projectid}/members/${getUserResponse.data.id}`, config)
                    .then((results) => {
                        console.log('deleteOK:', JSON.stringify(results.data));
                        resolve({ success: true, error: results.data }); // 解决 Promise，并返回成功的响应
                    })
                    .catch((error) => {
                        console.error('deletefailed:', error.response ? error.response.data : error.message);

                        if (error.response &&error.response.status == 403) {
                            resolve({ success: false, error: error.response.data, message:'帐号并没有该操作的权限或者项目设置不允许该操作'  }); // 解决 Promise，并返回失败的响应
                        } else {
                            resolve({ success: false, error: error.response ? error.response.data : error.message }); // 解决 Promise，并返回失败的响应
                        }
                    });
                });
            });

            const deleteResults = await Promise.all(deletePromises);
            return deleteResults; // 返回所有删除操作的结果
        } else {
            // 捕获并返回错误信息
            console.error('Get User Info FaildGroups:', JSON.stringify(getUserResponse.data));
            return [{ success: false, error: JSON.stringify(getUserResponse.data) }];
        }
    } catch (error) {
        // 捕获并返回错误信息
        console.error('processDeleteGroups:', error.response ? error.response.data : error.message);
        return [{ success: false, error: error.response ? error.response.data : error.message }];
    }
}
async function GetAllProjectsGroupsWithUser(MyPrivate_Key,checkid) {

    var checkUser = await getOtherUser(MyPrivate_Key, checkid);

    return getMasterAllinfo(MyPrivate_Key, checkUser.id);

}

// 处理所有项目的主函数
async function processAllProjects(ChangeProjects, DeleteProjects, ChangeGroups, DeleteGroups) {
    try {
        // 处理 ChangeProjects 的串行 add 和 move 操作
        let MychangeResults=[];
        if (ChangeProjects.length > 0) {
            MychangeResults = await processChangeProject(ChangeProjects);
        }

        // 并行处理 DeleteProjects 的 delete 操作
        let MydeleteResults = [];
        if (DeleteProjects.length > 0) {
             MydeleteResults = await processDeleteProjects(DeleteProjects);
        }
        let MyChangeGroupsResults = [];
        if (ChangeGroups.length > 0) {
            MyChangeGroupsResults = await processChangeGroup(ChangeGroups);
        }
        let MyDeleteGroupsResults = [];
        if (DeleteGroups.length > 0) {
            MyDeleteGroupsResults = await processDeleteGroups(DeleteGroups);
        }
        // 返回所有操作的结果
        return {
            changeResults: MychangeResults.concat(MyChangeGroupsResults),
            deleteResults: MydeleteResults.concat(MyDeleteGroupsResults)
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
                const jsonobj = JSON.parse(data);
                const MyPrivate_Key = jsonobj.Private_Key;
                getMasterAll(MyPrivate_Key)
                    .then((results) => {
                        res.writeHead(200, {
                            'Content-Type': 'text/json'
                        });
                        const outString = JSON.stringify(results);
                        res.write(outString);
                        res.end();
                    })
                    .catch((error) => {
                        if (error.response) {
                            res.writeHead(error.response.status, error.response.headers);
                            res.write(JSON.stringify(error.response.data));
                            res.end();

                        } else if (error.request) {
                            send404(res);
                        } else {
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
              var ChangeGroups = [];
              var DeleteGroups = [];
          //整理一下数据储存下来
              slelectinf.forEach(function (porject) {


              var parts = porject.id.split('__RadioSelect__');
              var SaveInfo = {};
              SaveInfo.id = parts[0];
              SaveInfo.index = parts[1];
              SaveInfo.projectid = parts[2];
              SaveInfo.bProject = parts[3];
              SaveInfo.Private_Key = MyPrivate_Key;
              SaveInfo.transformid = transformid;
              if (porject.checked == true && parts[1] == 3 && parts[3]==1) {
                  ChangeProjects.push(SaveInfo);
              } else if (porject.checked == true && parts[1] == 1 && parts[3]==1) {
                  DeleteProjects.push(SaveInfo);
              } else if (porject.checked == true && parts[1] == 3 && parts[3] == 0) {
                  ChangeGroups.push(SaveInfo);
              } else if (porject.checked == true && parts[1] == 1 && parts[3] == 0) {
                  DeleteGroups.push(SaveInfo);
              }
          });
              console.log('ChangeProjects : ' + ChangeProjects.length);
              console.log('DeleteProjects : ' + DeleteProjects.length);
              console.log('ChangeGroups : ' + ChangeGroups.length);
              console.log('DeleteGroups : ' + DeleteGroups.length);
          // 处理所有项目，并在完成后发送响应
              processAllProjects(ChangeProjects, DeleteProjects, ChangeGroups, DeleteGroups)
                  .then((results) => {
                  // 将结果转换为字符串
                 // const resultString = 'test';
                  const resultString = JSON.stringify(results);
                  console.log('log:processAllProjectsDone:', resultString);
                  // 设置响应头
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.write(resultString);
                  // 发送响应数据
                  res.end();
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
  } else if (url == '/check/server') {


      let data = '';
      req.on('data', function (chunk) {
          data += chunk;
      });
      req.on('end', function () {

          try {
              console.log('POST data received' + data);
              const jsonobj = JSON.parse(data);
              const MyPrivate_Key = jsonobj.Private_Key;
              const checkID = jsonobj.checkID;

              GetAllProjectsGroupsWithUser(MyPrivate_Key, checkID)
                  .then((results) => {
                      res.writeHead(200, {
                          'Content-Type': 'text/json'
                      });
                      const outString = JSON.stringify(results);
                      res.write(outString);
                      res.end();
                  })
                  .catch((error) => {
                      if (error.response) {
                          res.writeHead(error.response.status, error.response.headers);
                          res.write(JSON.stringify(error.response.data));
                          res.end();

                      } else if (error.request) {
                          send404(res);
                      } else {
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

  } else {
    send404(res);
  }
});

const PORT = argv.p || 3000;

server.listen(PORT, () => {
  console.log(`Examples running on ${PORT}`);
});
