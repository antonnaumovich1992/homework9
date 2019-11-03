const SIZE_CONTROL = 50;

let cropData = {
        radius: 0,
        x: 0,
        y: 0,
    },
    canvas = document.getElementById('preview'),
    cropCanvas = document.createElement('canvas'),
    mode = null,
    changeMade = false,
    frameRequest;

document.forms.fileAdd.elements.file.addEventListener('change', function () {
    this.blur();
    let file = this.files[0];
    if (file) {
        cancelAnimationFrame(frameRequest);
        loadImage(file).then((image) => {
            cropData.radius = Math.min(image.width, image.height) / 6;
            cropData.x = image.width / 2;
            cropData.y = image.height / 2;
            canvas.width = cropCanvas.width = image.width;
            canvas.height = cropCanvas.height = image.height;
            changeMade = true;
            render(image);

        });
    }
});

document.forms.saveForm.addEventListener('submit', function (event) {
    event.preventDefault();
    let fileName = this.elements.fileName.value + '.jpeg';

    let saveCanvas = document.createElement('canvas'),
        width = saveCanvas.width = cropData.radius * 2,
        height = saveCanvas.height = cropData.radius * 2,
        {
            x,
            y,
            radius
        } = cropData;

    let ctx = saveCanvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(canvas, x - radius, y - radius, width, height, 0, 0, width, height);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.arc(radius, radius, radius, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();

    saveCanvas.toBlob(function (blob) {
        let a = document.createElement('a');
        a.download = fileName;
        a.href = URL.createObjectURL(blob);
        a.dispatchEvent(new MouseEvent('click'));
        URL.revokeObjectURL(a.href);
    })
});

canvas.addEventListener('mousedown', (event) => {
    let x = event.offsetX,
        y = event.offsetY;

    if (isResizeMode(x, y)) {
        mode = 'resize';
    } else {
        mode = 'move';
    }

});

canvas.addEventListener('mousemove', (event) => {
    if (mode === 'resize') {
        cropData.radius = Math.abs(event.offsetX - cropData.x);
        changeMade = true;
    } else if (mode === 'move') {
        cropData.x = event.offsetX;
        cropData.y = event.offsetY;
        changeMade = true;
    }
});

canvas.addEventListener('mouseup', () => {
    mode = null;
});


function isResizeMode(x, y) {
    let leftSide = cropData.x - cropData.radius,
        rightSide = cropData.x + cropData.radius;
    return cropData.y - SIZE_CONTROL <= y &&
        y <= cropData.y + SIZE_CONTROL &&
        (leftSide - SIZE_CONTROL <= x &&
            x <= leftSide + SIZE_CONTROL ||
            rightSide - SIZE_CONTROL <= x &&
            x <= rightSide + SIZE_CONTROL)
}

function loadImage(file) {
    return new Promise((resolve) => {
        let image = new Image();
        image.addEventListener('load', function listener() {
            image.removeEventListener('load', listener);
            URL.revokeObjectURL(image.src);
            resolve(image);
        });
        image.src = URL.createObjectURL(file)
    })
}

function render(image) {
    let width = image.width,
        height = image.height,
        ctx = canvas.getContext('2d'),
        cropCtx = cropCanvas.getContext('2d');

    frameRequest = requestAnimationFrame(function () {
        if (changeMade) {
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(image, 0, 0, width, height);
            cropCtx.save();
            cropCtx.clearRect(0, 0, width, height);
            cropCtx.fillStyle = 'rgba(0,0,0,0.5)';
            cropCtx.fillRect(0, 0, width, height);
            cropCtx.globalCompositeOperation = 'destination-out';
            cropCtx.fillStyle = '#fff';
            cropCtx.beginPath();
            cropCtx.arc(cropData.x, cropData.y, cropData.radius, 0, 2 * Math.PI);
            cropCtx.closePath();
            cropCtx.fill();
            cropCtx.restore();

            ctx.drawImage(cropCanvas, 0, 0, width, height);

            changeMade = false;
        }
        render(image);
    });
}