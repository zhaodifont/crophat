// 加载 icon
function loadingStart(tipsContent, errorTips, iconUrl) {
    var isSupportTouch = window.supportTouch;
    $("#loadingSection .body div").unbind(isSupportTouch ? "touchend" : "click");
    if (tipsContent) {
        $("#loadingSection .body p").html(tipsContent);
        if (errorTips === true) {
            if (iconUrl) {
                $("#loadingSection .body img")[0].src = iconUrl;
            } else {
                $("#loadingSection .body img")[0].src = "http://res.tu.qq.com/assets/opchristmas2015_img/icon-loading.png";
            }
            $("#loadingSection .body img")[0].className = "";
            $("#loadingSection .body div").css("display", "");
            $("#loadingSection .body div").one(isSupportTouch ? "touchend" : "click", cropStop);
        } else {
            $("#loadingSection .body div").css("display", "none");
            $("#loadingSection .body img")[0].src = "http://res.tu.qq.com/assets/opchristmas2015_img/icon-loading.png";
            $("#loadingSection .body img")[0].className = "animate";
        }
    } else {
        $("#loadingSection .body div").css("display", "none");
        $("#loadingSection .body img")[0].src = "http://res.tu.qq.com/assets/opchristmas2015_img/icon-loading.png";
        $("#loadingSection .body img")[0].className = "animate";
        $("#loadingSection .body p").text("加载中请稍候");
    }
    $("#loadingSection").css("display", "");
}

function loadingStop() {
    $("#loadingSection").css("display", "none");
}


//pageRecordClick  统计

var canvasDom;
var canvasCtx;
var cropGesture = null;

// 点击 定制圣诞头像 $("#welcomeSection .choose-btn").on("click", indexCropChoose);
function indexCropChoose(evt) {
    // pageRecordClick("sng.tu.christmas2015.indexupload");
    cropChoose();
}

function resultCropChoose(evt) {
    // pageRecordClick("sng.tu.christmas2015.resultupload");
    cropChoose();
}

function cropCropStart() {
    // pageRecordClick("sng.tu.christmas2015.cropupload");
    cropStart();
}

//  裁剪系列
function cropChoose(evt) {
    // 从微信缓存中获取曾经上传过的照片
    if (window.isInWechat) {
        var wxHeadImgUrl = pageGetCookie("ttpt-wxheadimgurl");
        if (wxHeadImgUrl) {
            loadingStart("");
            $.get("api/getHeadIcon.php?url=" + encodeURIComponent(wxHeadImgUrl), function (data, status, xhr) {
                if (status == "success" && data.length > 0) {
                    var photoImg = new Image();
                    photoImg.onload = function () {
                        loadingStop();
                        cropLoaded(this);
                    }
                    photoImg.src = "data:image/jpeg;base64," + data;
                } else {
                    loadingStop();
                    cropStart();
                }
            });
        } else {
            var wxState = pageGetParam("state");
            if (wxState) {
                cropStart();
            } else {
                authorizeByWechatRecirect();
            }
        }
    } else if ((window.isInMqzone || !window.supportTouch) && window.p_uin.length > 0 && window.p_skey.length > 0) {
        loadingStart("");
        $.get("api/getHeadIcon.php", function (data, status, xhr) {
            if (status == "success" && data.length > 0) {
                var photoImg = new Image();
                photoImg.onload = function () {
                    loadingStop();
                    cropLoaded(this);
                }
                photoImg.src = "data:image/jpeg;base64," + data;
            } else {
                loadingStop();
                cropStart();
            }
        });
    } else {
        cropStart();
    }
    return preventEventPropagation(evt);
}

// $("#uploadInput") 原始上传文件
function cropStart(evt) {
    var $upload = $("#uploadInput");
    $upload.unbind("change");
    $upload.one("change", cropChanged);
    $upload.trigger("click");
    if (window.isInMqq && window.self != window.top) {
        var followObj = {
            postcode: 'follow',
            data: {}
        }
        window.parent.postMessage(followObj, '*');
    }
    return preventEventPropagation(evt);
}

function cropStop(evt) {
    var isSupportTouch = window.supportTouch;
    cropGesture.unbindEvents();
    $("#cropBar .choose-btn").unbind(isSupportTouch ? "touchend" : "click");
    $("#cropBar .next-btn").unbind(isSupportTouch ? "touchend" : "click");
    $("#cropSection").css("display", "none");
    $("#cropMaskUp").css("visibility", "hidden");
    $("#cropMaskDown").css("visibility", "hidden");
    $("#cropImg").css("display", "none");
    $("#cropImg").attr("src", "");
    $("#uploadInput").unbind("change");
    loadingStop();
    return preventEventPropagation(evt);
}

// 当file有变动的时候
function cropChanged(evt) {
    if (this.files.length <= 0) {
        cropStop();
        return preventEventPropagation(evt);
    }
    $("#cropSection").css("display", "");
    loadingStart("");
    var file = this.files[0];
    var reader = new FileReader();
    reader.onload = function () {
        var binary = this.result;
        var binaryData = new BinaryFile(binary); // 转为二进制
        var imgExif = EXIF.readFromBinaryFile(binaryData); // 获取图像信息
        var fullScreenImg = new Image();
        fullScreenImg.onload = function () {
            cropLoaded(this);
            loadingStop();
        }
        var mpImg = new MegaPixImage(file);  // 将传入的图片调整为合理的大小
        mpImg.render(fullScreenImg, {
            maxWidth: 960,
            maxHeight: 960,
            orientation: imgExif.Orientation // 位置信息
        });
    }
    reader.readAsBinaryString(file);
    return preventEventPropagation(evt);
}

// 第二页 设置图片在页面中的位置
function cropLoaded(img) {
    var isSupportTouch = window.supportTouch;
    $("#cropSection").css("display", "");
    var $cropLayer = $("#cropLayer");
    var cropSectionHeight = $("#cropSection").height();
    var cropBarHeight = $("#cropBar").height();
    var cropLayerHeight = $cropLayer.height();
    var cropLayerOriginY = (cropSectionHeight - cropBarHeight - cropLayerHeight) * 0.5;
    $cropLayer.css("top", [cropLayerOriginY * 100 / cropSectionHeight, "%"].join(""));
    $("#cropMaskUp").css("height", [cropLayerOriginY * 100 / cropSectionHeight, "%"].join(""));
    $("#cropMaskUp").css("top", 0);
    $("#cropMaskUp").css("visibility", "visible");
    $("#cropMaskDown").css("height", [cropLayerOriginY * 100 / cropSectionHeight, "%"].join(""));
    $("#cropMaskDown").css("top", [(cropLayerOriginY + cropLayerHeight) * 100 / cropSectionHeight, "%"].join(""));
    $("#cropMaskDown").css("visibility", "visible");
    var imgWidth = img.width;
    var imgHeight = img.height;
    var ratioWidth = $cropLayer.width() / imgWidth;
    var ratioHeight = $cropLayer.height() / imgHeight;
    var ratio = ratioWidth > ratioHeight ? ratioWidth : ratioHeight;
    cropGesture.targetMinWidth = imgWidth * ratio;
    cropGesture.targetMinHeight = imgHeight * ratio;
    var imgOriginX = ($cropLayer.width() - cropGesture.targetMinWidth) * 0.5;
    var imgOriginY = ($cropLayer.height() - cropGesture.targetMinHeight) * 0.5;
    var $cropImg = $("#cropImg");
    $cropImg.css("display", "");
    $cropImg.width(cropGesture.targetMinWidth);
    $cropImg.height(cropGesture.targetMinHeight);
    $cropImg.css("left", [imgOriginX, "px"].join(""));
    $cropImg.css("top", [imgOriginY, "px"].join(""));
    $cropImg[0].src = img.src;
    cropGesture.unbindEvents();
    cropGesture.bindEvents();
    $("#cropBar .choose-btn").unbind(isSupportTouch ? "touchend" : "click");
    $("#cropBar .choose-btn").on(isSupportTouch ? "touchend" : "click", cropCropStart);
    $("#cropBar .next-btn").unbind(isSupportTouch ? "touchend" : "click");
    $("#cropBar .next-btn").on(isSupportTouch ? "touchend" : "click", cropConfirm);
    return false;
}

//  页面中手指滑动调整图片 松开时 不让图片跑偏
function cropConfirm(evt) {
    // pageRecordClick("sng.tu.christmas2015.nextbtn");
    var canvasScale = canvasDom.height / $("#cropLayer").height();
    var $cropImg = $("#cropImg");
    var imgOrigin = {
        x: parseInt($cropImg.css("left")) || 0,
        y: parseInt($cropImg.css("top")) || 0
    };
    var imgSize = {
        width: $cropImg.width(),
        height: $cropImg.height()
    };
    canvasCtx.clearRect(0, 0, canvasDom.width, canvasDom.height);
    canvasCtx.drawImage($cropImg[0], imgOrigin.x * canvasScale, imgOrigin.y * canvasScale, imgSize.width * canvasScale, imgSize.height * canvasScale);
    var dataURL = "";
    if (window.isAndroid) {
        var imgEncoder = new JPEGEncoder();
        dataURL = imgEncoder.encode(canvasCtx.getImageData(0, 0, canvasDom.width, canvasDom.height), 100, true);
    } else {
        dataURL = canvasDom.toDataURL("image/jpeg", 1.0);
    }
    var dataComponent = dataURL.split(",");
    if (dataComponent.length >= 2) {
        var dataBase64 = dataComponent[1];
        if (dataBase64.length > 0) {
            cropStop();
            hatStart(dataBase64);
        }
    }
    return preventEventPropagation(evt);
}
var gHatId = "sdm1";

function hatStart(imgData) {
    $("#hatFace").attr("src", "data:image/jpeg;base64," + imgData);
    $("#" + gHatId).css("border", "2px solid #f80051");
    $("#hatStamp")[0].className = "hat-stamp-on";
    $("#hatSection").css("display", "");
    var $hatLayer = $("#hatLayer");
    var hatSectionHeight = $("#hatSection").height();
    var hatBarHeight = $("#hatBar").height();
    var hatLayerHeight = $hatLayer.height();
    var hatLayerOriginY = (hatSectionHeight - hatBarHeight - hatLayerHeight) * 0.01;
    $hatLayer.css("top", [hatLayerOriginY * 100 / hatSectionHeight, "%"].join(""));
    $("#hatMaskUp").css("height", [hatLayerOriginY * 100 / hatSectionHeight, "%"].join(""));
    $("#hatMaskUp").css("top", 0);
    $("#hatMaskUp").css("visibility", "visible");
    $("#hatMaskDown").css("height", [hatLayerOriginY * 100 / hatSectionHeight, "%"].join(""));
    $("#hatMaskDown").css("top", [(hatLayerOriginY + hatLayerHeight) * 100 / hatSectionHeight, "%"].join(""));
    $("#hatMaskDown").css("visibility", "visible");
    var hatSectionWidth = $("#hatSection").width();
    var hatStampWidth = $("#hatStamp").width();
    $("#hatStamp").css("left", [(hatSectionWidth - hatStampWidth) * 0.5, "px"].join(""));
    $("#hatStamp").css("top", "0px");
}

function chooseHat(id) {
    pageRecordClick("sng.tu.christmas2015." + id);
    $("#" + gHatId).css("border", "");
    if (id == "sdm1" || id == "sdm2") {
        $("#hatSection .choose-download").css("display", "none");
        $("#" + id).css("border", "2px solid #f80051");
        $("#hatStamp .hat-icon").attr("src", "res/icon-" + id + ".png");
    } else {
        $("#" + id).css("border", "2px solid #d0d0d0");
        if (id == "sdm4") {
            $("#hatSection .choose-download").css("left", "48%");
        } else if (id == "sdm5") {
            $("#hatSection .choose-download").css("left", "65%");
        } else {
            $("#hatSection .choose-download").css("left", "32%");
        }
        $("#hatSection .choose-download").css("display", "block");
    }
    gHatId = id;
}

function hatConfirm(evt) {
    var $hatStamp = $("#hatStamp");
    var hatStampTransform = $hatStamp.css("-webkit-transform");
    $hatStamp.css("transform", "");
    $hatStamp.css("-webkit-transform", "");
    var hatStampOffset = $hatStamp.find("img").offset();
    $hatStamp.css("transform", hatStampTransform);
    $hatStamp.css("-webkit-transform", hatStampTransform);
    var hatLayerOffset = $("#hatLayer").offset();
    var hatStampFrame = {
        x: (hatStampOffset.left - hatLayerOffset.left + hatStampOffset.width * 0.5) / hatLayerOffset.width,
        y: (hatStampOffset.top - hatLayerOffset.top + hatStampOffset.height * 0.5) / hatLayerOffset.height,
        width: hatStampOffset.width * parseFloat($hatStamp.attr("scale")) / hatLayerOffset.width,
        height: hatStampOffset.height * parseFloat($hatStamp.attr("scale")) / hatLayerOffset.height,
        rotation: parseFloat($hatStamp.attr("rotation"))
    };
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasDom.width, canvasDom.height);
    canvasCtx.drawImage($("#hatFace")[0], 0, 0, canvasDom.width, canvasDom.height);
    canvasCtx.translate(hatStampFrame.x * canvasDom.width, hatStampFrame.y * canvasDom.height);
    canvasCtx.rotate(hatStampFrame.rotation);
    canvasCtx.drawImage($hatStamp.find("img")[0], -hatStampFrame.width * canvasDom.width * 0.5, -hatStampFrame.height * canvasDom.height * 0.5, hatStampFrame.width * canvasDom.width, hatStampFrame.height * canvasDom.height);
    canvasCtx.restore();
    var dataURL = "";
    if (window.isAndroid) {
        var imgEncoder = new JPEGEncoder();
        dataURL = imgEncoder.encode(canvasCtx.getImageData(0, 0, canvasDom.width, canvasDom.height), 100, true);
    } else {
        dataURL = canvasDom.toDataURL("image/jpeg", 1);
    }
    var dataComponent = dataURL.split(",");
    if (dataComponent.length >= 2) {
        var dataBase64 = dataComponent[1];
        if (dataBase64.length > 0) {
            $("#hatSection").data("result", dataBase64);
            $("#hatStamp")[0].className = "hat-stamp-off";
            if ((window.isInMqzone || !window.supportTouch) && window.p_uin.length > 0 && window.p_skey.length > 0) {
                hatConfirmQZone();
            } else {
                hatConfirmOther();
            }
        }
    }
    // pageRecordClick("sng.tu.christmas2015.confirmbtn");
    return preventEventPropagation(evt);
}

function hatConfirmQZone() {
    loadingStart("圣诞头像生成中");
    var imgData = $("#hatSection").data("result");
    var uploadUrl = "api/setQZHeadIcon.php";
    $.ajax({
        url: uploadUrl,
        type: "POST",
        data: imgData,
        dataType: "json",
        timeout: 30000,
        success: function (data, textStatus) {
            if (data.ret == 0) {
                $("#saveSection .setupwx-tips").css("display", "none");
                $("#saveSection .setupqz-tips").css("display", "");
                hatConfirmOther();
            } else {
                loadingStart("生成失败(" + data.ret + ")", true);
                $("#hatStamp")[0].className = "hat-stamp-on";
            }
        }, error: function (req, errorType, error) {
            loadingStart("生成失败(" + errorType + ")", true);
            $("#hatStamp")[0].className = "hat-stamp-on";
        }
    });
    pageRecordClick("sng.tu.christmas2015.setqzhead");
    return false;
}

function hatConfirmOther() {
    loadingStart("圣诞头像生成中");
    var imgData = $("#hatSection").data("result");
    var uploadUrl = "../../cgi/doStoreImageV5.php";
    $.ajax({
        url: uploadUrl,
        type: "POST",
        data: imgData,
        dataType: "json",
        timeout: 30000,
        success: function (data, textStatus) {
            if (data.ret == 0) {
                $("#saveSection .retry-btn").data("cosid", data.id);
                var photoImg = new Image();
                photoImg.onload = function () {
                    loadingStop();
                    $("#shareImg").attr("src", data.url);
                    if (window.isInWechat) {
                        $("#saveSection .setupqz-tips").css("display", "none");
                        $("#saveSection .setupwx-tips").css("display", "");
                    } else if (window.isInMqzone || !window.supportTouch) {
                        $("#saveSection .save-tips").css("display", "none");
                        $("#saveSection .qzcache-tips").css("display", "");
                    }
                    $("#saveSection").css("display", "");
                    $("#hatSection").css("display", "none");
                    var shareUrl = window.baseUrl + "index.html?id=" + data.id;
                    setShareParams(data.url, shareUrl);
                }
                photoImg.src = data.url;
            } else {
                loadingStart("生成失败(" + data.ret + ")", true);
                $("#hatStamp")[0].className = "hat-stamp-on";
            }
        }, error: function (req, errorType, error) {
            loadingStart("生成失败(" + errorType + ")", true);
            $("#hatStamp")[0].className = "hat-stamp-on";
        }
    });
    return false;
}

function hatTouchStart(evt) {
    var touches = evt.touches || evt.originalEvent.touches;
    var touch = touches[0];
    var offset = {
        "x": touch.pageX,
        "y": touch.pageY
    };
    hatDragStart(offset, touch.target);
    return preventEventPropagation(evt);
}

function hatTouchMove(evt) {
    var touches = evt.touches || evt.originalEvent.touches;
    var touch = touches[0];
    var offset = {
        "x": touch.pageX,
        "y": touch.pageY
    };
    hatDragMove(offset);
    return preventEventPropagation(evt);
}

function hatTouchEnd(evt) {
    hatDragEnd();
    return preventEventPropagation(evt);
}

function hatMouseDown(evt) {
    var offset = {
        "x": evt.pageX,
        "y": evt.pageY
    };
    hatDragStart(offset, evt.srcElement);
    return preventEventPropagation(evt);
}

function hatMouseMove(evt) {
    var offset = {
        "x": evt.pageX,
        "y": evt.pageY
    };
    hatDragMove(offset);
    return preventEventPropagation(evt);
}

function hatMouseUp(evt) {
    hatDragEnd();
    return preventEventPropagation(evt);
}
var hatMode = null;
var hatOrigin = {};
var hatFrom = {};

function hatDragStart(pos, tgt) {
    var $hatStamp = $("#hatStamp");
    var hatStampTransform = $hatStamp.css("-webkit-transform");
    $hatStamp.css("transform", "");
    $hatStamp.css("-webkit-transform", "");
    var hatStampOrigin = $hatStamp.offset();
    $hatStamp.css("transform", hatStampTransform);
    $hatStamp.css("-webkit-transform", hatStampTransform);
    var hatLayerOrigin = $("#hatLayer").offset();
    if ($(tgt).attr("anchor") == "1") {
        hatMode = "anchor";
        hatOrigin = {
            x: hatStampOrigin.left - hatLayerOrigin.left + hatStampOrigin.width * 0.5,
            y: hatStampOrigin.top - hatLayerOrigin.top + hatStampOrigin.height * 0.5,
            scale: parseFloat($hatStamp.attr("scale")),
            rotation: parseFloat($hatStamp.attr("rotation"))
        };
        hatFrom = {
            x: pos.x - hatLayerOrigin.left - hatOrigin.x,
            y: pos.y - hatLayerOrigin.top - hatOrigin.y
        };
    } else {
        hatMode = "drag";
        hatOrigin = {
            x: hatStampOrigin.left - hatLayerOrigin.left,
            y: hatStampOrigin.top - hatLayerOrigin.top
        };
        hatFrom = pos;
    }
}

function hatDragMove(pos) {
    var $hatStamp = $("#hatStamp");
    if (hatMode == "anchor") {
        var hatLayerOrigin = $("#hatLayer").offset();
        var hatTo = {
            x: pos.x - hatLayerOrigin.left - hatOrigin.x,
            y: pos.y - hatLayerOrigin.top - hatOrigin.y
        };
        var distanceFrom = distanceBetweenPoints({
            x: 0,
            y: 0
        }, hatFrom);
        var distanceTo = distanceBetweenPoints({
            x: 0,
            y: 0
        }, hatTo);
        var scale = hatOrigin.scale * distanceTo / distanceFrom;
        var rotationFrom = angleBetweenPoints({
            x: 0,
            y: 0
        }, hatFrom);
        var rotationTo = angleBetweenPoints({
            x: 0,
            y: 0
        }, hatTo);
        var rotation = hatOrigin.rotation + rotationTo - rotationFrom;
        var degree = rotation * 180 / Math.PI;
        $hatStamp.attr("scale", scale);
        $hatStamp.attr("rotation", rotation);
        $hatStamp.css("transform", "scale(" + scale + ") rotate(" + degree + "deg)");
        $hatStamp.css("-webkit-transform", "scale(" + scale + ") rotate(" + degree + "deg)");
    } else if (hatMode == "drag") {
        var offset = {
            x: pos.x - hatFrom.x,
            y: pos.y - hatFrom.y
        };
        var current = {
            x: hatOrigin.x + offset.x,
            y: hatOrigin.y + offset.y
        };
        $hatStamp.css("left", [current.x, "px"].join(""));
        $hatStamp.css("top", [current.y, "px"].join(""));
    }
}

function hatDragEnd() {
    hatMode = null;
}

function sharePageByPlatform(evt) {
    pageRecordClick("sng.tu.christmas2015.sharebtn");
    var cosid = $("#saveSection .retry-btn").data("cosid");
    var shareUrl = window.baseUrl + "index.html?id=" + cosid;
    var shareImg = $("#shareImg")[0].src;
    var imgData = $("#hatSection").data("result");
    if (window.supportTouch) {
        if (window.isInMqq && window.self != window.top) {
            var shareObj = {
                postcode: "share",
                data: {
                    title: $("meta[name=description]").attr("content"),
                    desc: document.title,
                    imageUrl: shareImg,
                    url: shareUrl
                }
            }
            window.parent.postMessage(shareObj, '*');
        } else {
            if (window.isInMqzone && imgData.length > 0 && window.p_uin.length > 0 && window.p_skey.length > 0) {
                $("#shareSection").css("display", "");
            } else {
                $("#shareSection").css("display", "");
            }
        }
    } else {
        if (imgData && window.p_uin.length > 0 && window.p_skey.length > 0) {
            $("#shareSection").css("display", "");
        } else {
            sharePageByQZoneRedirect(shareImg, shareUrl);
        }
    }
    return preventEventPropagation(evt);
}

function setShareParams(shareImg, shareUrl) {
    console.log("shareUrl:" + shareUrl);
    var shareTitle = $("meta[name=description]").attr("content");
    var shareDesc = document.title;
    if (window.isInWechat) {
        var shareParams = {
            title: shareTitle,
            desc: shareDesc,
            link: shareUrl,
            imgUrl: shareImg,
            success: function () {}, cancel: function () {}
        };
        if (typeof (wx) == "object") {
            wx.onMenuShareTimeline(shareParams);
            wx.onMenuShareAppMessage(shareParams);
            wx.onMenuShareQQ(shareParams);
            wx.onMenuShareWeibo(shareParams);
            wx.onMenuShareQZone(shareParams);
        } else {
            loadScript("http://res.wx.qq.com/open/js/jweixin-1.0.0.js", function () {
                loadScript("http://tu.qq.com/websites/wxBridge.php", function () {
                    wx.ready(function () {
                        wx.onMenuShareTimeline(shareParams);
                        wx.onMenuShareAppMessage(shareParams);
                        wx.onMenuShareQQ(shareParams);
                        wx.onMenuShareWeibo(shareParams);
                        wx.onMenuShareQZone(shareParams);
                    });
                });
            });
        }
    } else if (window.isInMqq) {
        var shareParams = {
            share_url: shareUrl,
            title: shareTitle,
            desc: shareDesc,
            image_url: shareImg
        };
        if (typeof (mqq) == "object") {
            mqq.data.setShareInfo(shareParams);
        } else {
            loadScript("http://pub.idqqimg.com/qqmobile/qqapi.js?_bid=152", function () {
                mqq.data.setShareInfo(shareParams);
            });
        }
    } else if (window.isInMqzone) {
        if (typeof (QZAppExternal) == "object") {
            QZAppExternal.setShare(function (data) {}, {
                'type': "share",
                'image': [shareImg, shareImg, shareImg, shareImg, shareImg],
                'title': [shareTitle, shareTitle, shareTitle, shareTitle, shareTitle],
                'summary': [shareDesc, shareDesc, shareDesc, shareDesc, shareDesc],
                'shareURL': [shareUrl, shareUrl, shareUrl, shareUrl, shareUrl]
            });
        } else {
            loadScript("http://qzs.qq.com/qzone/phone/m/v4/widget/mobile/jsbridge.js", function () {
                QZAppExternal.setShare(function (data) {}, {
                    'type': "share",
                    'image': [shareImg, shareImg, shareImg, shareImg, shareImg],
                    'title': [shareTitle, shareTitle, shareTitle, shareTitle, shareTitle],
                    'summary': [shareDesc, shareDesc, shareDesc, shareDesc, shareDesc],
                    'shareURL': [shareUrl, shareUrl, shareUrl, shareUrl, shareUrl]
                });
            });
        }
    }
}

// 重新制作

function retryButtonPressed(evt) {
    pageRecordClick("sng.tu.christmas2015.retry");
    var cosid = $("#saveSection .retry-btn").data("cosid");
    if (cosid) {
        window.location = window.baseUrl + "index.html?id=" + cosid;
    } else {
        window.location.reload();
    }
    return preventEventPropagation(evt);
}

function indexPageReady() {
    var cosid = pageGetParam("id");
    // 关闭加载
    document.getElementById("loadingSection").style.display = "none";

    // 非触屏 非webkit内核 则选择提示 手机扫码
    if (!window.supportTouch && !window.isWebkit) {
        var pageUrl = window.baseUrl + "index.html?id=" + cosid;
        var qrcodeUrl = "http://test.tu.qq.com/websites/qrcode.php?url=" + encodeURIComponent(pageUrl);
        document.getElementById("qrcodeImg").src = qrcodeUrl;
        document.getElementById("qrcodeSection").style.display = "";
        return;
    }
    if (window.isInWechat) {
        $("#saveSection .share-btn").css("display", "none");
    }
    window.p_uin = pageGetCookie("uin").replace(/o/, "");
    window.p_skey = pageGetCookie("p_skey");
    var shouldSetDefaultShareParams = true;
    var wxState = pageGetParam("state");
    var wxHeadImgUrl = pageGetParam("wxheadimgurl") || pageGetCookie("ttpt-wxheadimgurl");

    // 如果是在微信里 并且有state参数 并且有缓存的cookie
    if (window.isInWechat && wxState && wxHeadImgUrl.length > 0) {
        loadingStart("");
        $.get("api/getHeadIcon.php?url=" + encodeURIComponent(wxHeadImgUrl), function (data, status, xhr) {
            if (status == "success" && data.length > 0) {
                var photoImg = new Image();
                photoImg.onload = function () {
                    loadingStop();
                    cropLoaded(this);
                    $("#welcomeSection").css("display", "");
                }
                photoImg.src = "data:image/jpeg;base64," + data;
            } else {
                loadingStop();
                $("#welcomeSection").css("display", "");
            }
        });
    } else {
        // 貌似是可以显示上一个分享人设置的图片
        if (cosid.length > 0) {
            shouldSetDefaultShareParams = false;
            loadingStart("");
            var cgiUrl = "../../cgi/queryCosInfo.php?id=" + cosid;
            $.getJSON(cgiUrl, function (data, status, xhr) {
                if (status == "success") {
                    var photoImg = new Image();
                    photoImg.onload = function () {
                        loadingStop();
                        $("#resultImg").attr("src", this.src);
                        $("#resultSection").css("display", "");
                    };
                    photoImg.src = data.rawPhotoUrl;
                    var shareUrl = window.baseUrl + "index.html?id=" + cosid;
                    setShareParams(data.rawPhotoUrl, shareUrl);
                } else {
                    loadingStop();
                    $("#welcomeSection").css("display", "");
                    var shareImg = $("#defaultImg").attr("src");
                    var shareUrl = window.baseUrl + "index.html?id=" + cosid;
                    setShareParams(shareImg, shareUrl);
                }
            });
        } else {
            if (window.isInMqzone && window.p_uin.length > 0 && window.p_skey.length > 0) {
                loadingStart("");
                $.get("api/getHeadIcon.php", function (data, status, xhr) {
                    if (status == "success" && data.length > 0) {
                        var photoImg = new Image();
                        photoImg.onload = function () {
                            loadingStop();
                            cropLoaded(this);
                            $("#welcomeSection").css("display", "");
                        }
                        photoImg.src = "data:image/jpeg;base64," + data;
                    } else {
                        loadingStop();
                        $("#welcomeSection").css("display", "");
                    }
                });
            } else {
                $("#welcomeSection").css("display", "");
            }
        }
    }
    window.setTimeout(function () {
        $("#welcomeSection .choose-btn").on("click", indexCropChoose);
        $("#resultSection .choose-btn").on("click", resultCropChoose);

        // 让目标 arg2 在 容器 arg1 中 可以滑动 缩放的区域 arg3
        cropGesture = new EZGesture($("#cropLayer")[0], $("#cropImg")[0], {
            targetMinWidth: 420,
            targetMinHeight: 420
        });
        var $canvas = $("#cropCanvas");
        canvasDom = $canvas[0];
        canvasCtx = canvasDom.getContext("2d");
        cropGesture.targetMinWidth = canvasDom.width;
        cropGesture.targetMinHeight = canvasDom.height;
        $("#cropSection").css("visibility", "hidden");
        $("#cropSection").css("display", "");

        var cropLayerHeight = ($("#cropSection").width() * canvasDom.height * 100 / (canvasDom.width * $("#cropSection").height())).toFixed(2);
        $("#cropLayer").css("height", [cropLayerHeight, "%"].join(""));
        $("#cropSection").css("display", "none");
        $("#cropSection").css("visibility", "visible");

        var $hatSection = $("#hatSection");
        var $hatLayer = $("#hatLayer");
        $hatSection.css("visibility", "hidden");
        $hatSection.css("display", "");
        var hatLayerHeight = ($hatSection.width() * canvasDom.height * 100 / (canvasDom.width * $hatSection.height())).toFixed(2);
        $hatLayer.css("height", [hatLayerHeight, "%"].join(""));
        $hatSection.css("display", "none");
        $hatSection.css("visibility", "visible");
        if ((window.isInMqzone || !window.supportTouch) && window.p_uin.length > 0 && window.p_skey.length > 0) {
            $("#hatSection .confirm-btn").text("设为空间头像");
        }
        $("#hatSection .confirm-btn").on("click", hatConfirm);
        if (window.supportTouch) {
            $hatLayer.on("touchstart", hatTouchStart);
            $hatLayer.on("touchmove", hatTouchMove);
            $hatLayer.on("touchend", hatTouchEnd);
        } else {
            $hatLayer.on("mousedown", hatMouseDown);
            $hatLayer.on("mousemove", hatMouseMove);
            $hatLayer.on("mouseup", hatMouseUp);
        }
        $("#saveSection .share-btn").on("click", sharePageByPlatform);
        $("#saveSection .retry-btn").on("click", retryButtonPressed);
        $("#saveSection .download-btn").on("click", function () {
            // pageRecordClick("sng.tu.christmas2015.downloadbtn");
            window.location = "http://tu.qq.com/downloading.php?by=58";
        });
        $("#shareSection").on("click", function () {
            $("#shareSection").css("display", "none");
        });
        if (shouldSetDefaultShareParams) {
            var shareImg = $("#defaultImg").attr("src");
            var shareUrl = window.baseUrl + "index.html";
            setShareParams(shareImg, shareUrl);
        }
        var pf_flag = "other";
        if (window.isInWechat) {
            pf_flag = "wechat";
        } else if (window.isInMqzone) {
            pf_flag = "mqzone";
        } else if (window.isInMqq) {
            pf_flag = "mqq";
        }
        pageRecordPV(location.pathname + "-" + pf_flag);
    }, 0);
}

function indexPageResize() {}

function qzap_hash_time33(str) {
    var hash = 5381;
    var len = str.length;
    for (var i = 0; i < len; ++i) {
        hash = Number((hash << 5 & 0x7fffffff) + str.charCodeAt(i) + hash);
    }
    return hash & 0x7fffffff;
}

function publishShuoshuoByImgurl2(shareTitle, imgUrl, shareUrl) {
    loadingStart("正在分享");
    var getParamStr = "";
    if (window.p_uin && window.p_skey) {
        getParamStr = ["?u=o", window.p_uin, "&k=", encodeURIComponent(window.p_skey)].join("");
    }
    var gtk = qzap_hash_time33(window.p_skey);
    $.ajax({
        url: "http://mobile.qzone.qq.com/mood/publish_mood?qzonetoken=" + window.g_qzonetoken + "&g_tk=" + gtk,
        type: "POST",
        data: {
            "qzreferrer": 'http://ctc.qzs.qq.com/qzone/app/mood_v6/html/wall/wall_loveu.html?topic=wall_loveu&from=app',
            "opr_type": 'publish_shuoshuo',
            "res_uin": window.p_uin,
            "content": [shareTitle, shareUrl].join(" "),
            "richval": imgUrl,
            "richtype": 3,
            "lat": 0,
            "lon": 0,
            "issyncweibo": 0,
            "format": "json",
            "from_pt": 1,
        },
        dataType: "json",
        timeout: 15000,
        xhrFields: {
            withCredentials: true
        },
        success: function (data, textStatus) {
            if (data.data.ret == 0) {
                loadingStart("发表说说成功", true, "//res.tu.qq.com/assets/opchristmas2015_img/icon-succ2.png");
            } else {
                loadingStart(data.message || "发表说说失败..." + JSON.stringify(data), true);
            }
        }, error: function (req, errorType, error) {
            loadingStart(error, true);
        }
    });
}
