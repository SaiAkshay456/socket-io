
const form = document.getElementById("formInput");

form.addEventListener('submit', async function () {
    e.preventDefault();
    const fileE = document.getElementById('fileInput');
    const fname = fileE.file[0];
    const formdata = new FormData();
    formdata.append('file-image', fname);

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formdata,
        });
        const data = await response.json();
        alert(`your ats score ${data.finalScore}`);
    }
    catch (er) {
        console.log(er)
    }

})