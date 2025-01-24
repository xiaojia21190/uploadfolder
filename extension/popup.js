document.addEventListener("DOMContentLoaded", async function () {
  const fileInput = document.getElementById("fileInput");
  const fileName = document.getElementById("fileName");
  const uploadStatus = document.getElementById("uploadStatus");
  const uploadButton = document.getElementById("uploadButton");
  const doiInput = document.createElement("input");
  const progressBar = document.createElement("progress");

  // 添加进度条
  progressBar.style.width = "100%";
  progressBar.max = 100;
  progressBar.value = 0;
  uploadStatus.parentNode.insertBefore(progressBar, uploadStatus);

  // 添加DOI输入框
  doiInput.type = "text";
  doiInput.id = "doiInput";
  doiInput.placeholder = "请输入DOI";
  fileName.parentNode.insertBefore(doiInput, fileName);

  let selectedFile = null;

  // 恢复之前的状态
  const status = await chrome.storage.local.get("uploadStatus");
  if (status.uploadStatus) {
    updateStatus(status.uploadStatus);
  }

  // 监听状态变化
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === "local" && changes.uploadStatus) {
      updateStatus(changes.uploadStatus.newValue);
    }
  });

  function updateStatus(status) {
    if (!status) return;

    uploadStatus.textContent = status.message;

    if (status.progress !== undefined) {
      progressBar.value = status.progress;
    }

    switch (status.status) {
      case "processing":
      case "uploading":
        uploadButton.disabled = true;
        break;
      case "completed":
        uploadButton.disabled = false;
        break;
      case "error":
        uploadButton.disabled = false;
        break;
      case "exists":
        uploadButton.disabled = false;
        break;
    }
  }

  fileInput.addEventListener("change", function (e) {
    selectedFile = e.target.files[0];
    if (selectedFile) {
      fileName.textContent = `已选择: ${selectedFile.name}`;
      uploadButton.disabled = false;
    } else {
      fileName.textContent = "";
      uploadButton.disabled = true;
    }
  });

  uploadButton.addEventListener("click", async function () {
    if (!selectedFile || !doiInput.value) {
      uploadStatus.textContent = "请选择文件并输入DOI";
      return;
    }

    try {
      const base64 = await readFileAsBase64(selectedFile);
      chrome.runtime.sendMessage({
        type: "UPLOAD_PDF",
        pdfBase64: base64,
        doi: doiInput.value,
      });
    } catch (error) {
      await chrome.storage.local.set({
        uploadStatus: {
          status: "error",
          message: `处理文件失败: ${error.message}`,
          progress: 0,
        },
      });
    }
  });
});

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
