import React, { useState, useEffect } from "react";
import { gapi } from 'gapi-script';

const App = () => {
  const [config, setConfig] = useState({
    // Initially, no file is selected
    selectedFile: null,
    TOKEN_PATH: "token.json",
    SCOPES: ["https://www.googleapis.com/auth/drive"],
  });

  // const [ _gapi, setGapi ] = useState(null);

  // Replace with your API key, copied from https://console.cloud.google.com/apis/credentials
  const apiKey = "AIzaSyCS16uoSkvAw8qWISlAPLYPNCC4__6qYps";

  // Replace with your Client ID, copied from https://console.cloud.google.com/apis/credentials
  const clientId =
    "1051229922030-in1rp6cmj0n2ccf5b1p6ggtn54hj1sa6.apps.googleusercontent.com";

  // Replace with your Project number, copied from https://console.cloud.google.com/iam-admin/settings
  const projectNumber = "1051229922030";

  // Replace with a mime type unique to your application
  const mimeType = `application/my.app`;

  let oauthToken, fileId;

  useEffect(() => {
    gapi.load('auth');
		gapi.load('picker');
		gapi.load('client', () => gapi.client.load('drive', 'v3'));
  }, []);

  // On file select (from the pop up)
  const onFileChange = (event) => {
    setConfig({ selectedFile: event.target.files[0] });
  };

  const listFiles = () => {
    var request = gapi.client.drive.files.list({
      'maxResults': 10,
      // includeItemsFromAllDrives: true,
      // supportsAllDrives: true,
      // corpora: 'drive',
      // driveId: '1Dy8K6ka6m36m6nxfneJSvhYqzGVd0EMW',
      q: 'name contains \'TESTED\' and \'1Dy8K6ka6m36m6nxfneJSvhYqzGVd0EMW\' in parents',
    });

    // var IdRead;

    request.execute(function(resp) {
      console.log(resp);
      appendPre('Files:');
      var files = resp.files;
      if (files && files.length > 0) {
        for (var i = 0; i < files.length; i++) {
          // IdRead = files[0].id;
          var file = files[i];
          appendPre(file.name + ' (' + file.id + ')');
        }
      } else {
        appendPre('No files found.');
      }
    });
  };

  function appendPre(message) {
    var pre = document.getElementById('output');
    var textContent = document.createTextNode(message + '\n');
    pre.appendChild(textContent);
 
  }

  const upload = () => {
    const metadata = {
      name: config.selectedFile.name,
      mimeType,
      parents: ["1Dy8K6ka6m36m6nxfneJSvhYqzGVd0EMW"],
    };
    const form = new FormData();
    form.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" })
    );
    // form.append('file', JSON.stringify({ hello: 'world' }));
    form.append("file", config.selectedFile);

    fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
      {
        method: "POST",
        headers: new Headers({
          Authorization: "Bearer " + localStorage.getItem("token"),
        }),
        body: form,
      }
    )
      .then((result) => result.json())
      .then((value) => {
        console.log("Uploaded. Result:\n" + JSON.stringify(value, null, 2));
        fileId = value.id;
        document.getElementById("get").disabled = false;
        document.getElementById("update").disabled = false;
      })
      .catch((err) => console.error(err));
  };

  // // File content to be displayed after
  // // file upload is complete
  const fileData = () => {
    if (config.selectedFile) {
      return (
        <div>
          <h2>File Details:</h2>
          <p>File Name: {config.selectedFile.name}</p>
          <p>File Type: {config.selectedFile.type}</p>
          <p>
            Last Modified: {config.selectedFile.lastModifiedDate.toDateString()}
          </p>
        </div>
      );
    } else {
      return (
        <div>
          <br />
          <h4>Choose before Pressing the Upload button</h4>
          <div  id="output"></div>
        </div>
      );
    }
  };

  // From jsGoogleDrivDemo: https://github.com/RickMohr/jsGoogleDriveDemo

  function authorize() {
    if (!window.gapi.auth) return;
    window.gapi.auth.authorize({
        client_id: clientId,
        scope: ["https://www.googleapis.com/auth/drive"],
        plugin_name: "Web client 1",
        immediate: false
      },
      (result) => {
        if (result.error) {
          console.log(result.error);
        } else {
          oauthToken = result.access_token;
          console.log(`Authorized. Token: ${oauthToken}`);
          localStorage.setItem("token", oauthToken);
          window.gapi.client
            .init({
              apiKey: apiKey,
              // clientId and scope are optional if auth is not required.
              clientId: clientId,
              plugin_name: "Web client 1",
              scope: "profile",
            })
            .then(function () {
              // 3. Initialize and make the API request.
              return window.gapi.client.request({
                path: "/drive/v3/about",
                method: "GET",
                params: { fields: ["kind"] },
              });
            })
            .then(
              function (response) {
                console.log(response.result);
              },
              function (reason) {
                console.log("Error: " + reason.result.error.message);
              }
            );
          // document.getElementById('upload').disabled = false;
          // document.getElementById('pick').disabled = false;
        }
      }
    );
  }

  // From https://stackoverflow.com/a/55095062/362702
  // For upload we don't use gapi.client.drive.files.create() because it doesn't accept file content

  const get = (fileId) => {
    window.gapi.client.drive.files
      .get({ fileId, alt: "media" })
      .then((result) =>
        console.log("Fetched. Result: " + JSON.stringify(result.result))
      )
      .catch((err) => console.error(err));
  };

  function update() {
    const url =
      "https://www.googleapis.com/upload/drive/v3/files/" +
      fileId +
      "?uploadType=media";
    fetch(url, {
      method: "PATCH",
      headers: new Headers({
        Authorization: "Bearer " + oauthToken,
        "Content-type": mimeType,
      }),
      body: JSON.stringify({ hello: "universe" }),
    })
      .then((result) => result.json())
      .then((value) => {
        console.log("Updated. Result:\n" + JSON.stringify(value, null, 2));
      })
      .catch((err) => console.error(err));
  }

  // Modified from https://developers.google.com/picker/docs#example

  // function createPicker() {
  // 	const view = new google.picker.View(google.picker.ViewId.DOCS);
  // 	view.setMimeTypes(mimeType);
  // 	const picker = new google.picker.PickerBuilder()
  // 		.enableFeature(google.picker.Feature.NAV_HIDDEN)
  // 		.enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
  // 		.setAppId(projectNumber)
  // 		.setOAuthToken(oauthToken)
  // 		.addView(view)
  // 		.addView(new google.picker.DocsUploadView())
  // 		.setDeveloperKey(apiKey)
  // 		.setCallback(pickerCallback)
  // 		.build();
  // 	picker.setVisible(true);

  // 	function pickerCallback(data) {
  // 		if (data.action == google.picker.Action.PICKED) {
  // 			const fileId = data.docs[0].id;
  // 			console.log('Picked. FileId: ' + fileId);
  // 			get(fileId);
  // 		}
  // 	}
  // }

  return (
    <div>
      <h1>File Upload using React!</h1>
      <h3>Authorize then upload</h3>
      <div>
        <button id="authorize" onClick={() => authorize()}>
          Authorize
        </button>
        <input type="file" onChange={onFileChange} />
        {/* <button onClick={onFileUpload} disabled> Upload! </button> */}
        <button id="upload" onClick={() => upload()}>
          Upload
        </button>
        <button
          id="get"
          onClick={(fileId) => get("1yueZ7odCTAKCxBy1AGWxckWiShcl2wOW")}
        >
          Get
        </button>
        <button id="list" onClick={() => listFiles()}>
          List Files
        </button>
        <button id="update" onClick={() => update()} disabled>
          Update
        </button>
        {/* <button id="pick" onClick={() => createPicker()} disabled>Pick</button> */}
      </div>
      {fileData()}
    </div>
  );
};

export default App;
