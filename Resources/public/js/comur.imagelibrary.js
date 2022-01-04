var galleries = {};

$(function(){
    $('.fileinput-button').click(function(event){ 
        if($(event.target).is('span')) {
            $('#image_upload_file').click();
            event.stopPropagation();
            return false;
        } 
    });
});

function initializeImageManager(id, options, cb){
    if (typeof cb === 'function') {
        options.callback = cb;
    }
    if((typeof options.uploadConfig.library == 'undefined' || options.uploadConfig.library) &&
        typeof options.uploadConfig.libraryDir != 'undefined' &&
        typeof options.uploadConfig.libraryRoute != 'undefined' &&
        (typeof options.uploadConfig.showLibrary == 'undefined' || options.uploadConfig.showLibrary))
    {
        $('#select-existing').removeClass('hidden');
        $('#image_upload_tabs li:nth-child(2)').show();
        $('#existing-images .image-container').remove();
        $.ajax({
            url: Routing.generate(options.uploadConfig.libraryRoute),
            data: {dir: options.uploadConfig.libraryDir},
            success: function(responseData){
                var response = $.parseJSON(responseData);
                var files = response.files;
                for (var i = files.length - 1; i >= 0; i--) {
                    var now = new Date().getTime();
                    $('#existing-images').append('<div class="image-container" data-src="'+files[i]+'"><img src="/'+options.uploadConfig.webDir + '/'+response['thumbsDir']+'/'+files[i]+'?'+now+'" alt=""/></div>');
                }
                
                $('.image-container').click(function(){
                    $('#selected_image').val($(this).attr('data-src'));
                    initJCrop(id, options);
                });

            },
            type: 'POST'
        });
    }
    else{
        $('#select-existing').addClass('hidden');
        $('#image_upload_tabs li:nth-child(2)').hide();
    }
    $('#image_upload_tabs li:nth-child(3)').hide();
    var url = Routing.generate(options.uploadConfig.uploadRoute);
    $('#image_upload_file').fileupload({
        url: url,
        dataType: 'json',
        formData: {'config': JSON.stringify(options) },
        dropZone: $('#image_upload_drop_zone'),
        add: function(e, data) {
            var uploadErrors = [];

            var pattern = '(\.|\/)(' + options.uploadConfig.fileExt.replace(/\*\./g, '').split(';').join('|') + ')$';

            var acceptFileTypes = new RegExp(pattern, 'i');
            if(data.originalFiles[0]['type'].length && !acceptFileTypes.test(data.originalFiles[0]['type'])) {
                uploadErrors.push(comurImageTranslations['Filetype not allowed']);
            }
            if(data.originalFiles[0]['size'] && data.originalFiles[0]['size'] > options.uploadConfig.maxFileSize * 1024 * 1024 ) {
                uploadErrors.push(comurImageTranslations['File is too big']);
            }
            var errors = $('#image_upload_widget_error');
            if(uploadErrors.length > 0) {
                errors.html(uploadErrors.join('<br/>'));
                errors.parent().show();
            } else {
                errors.html('');
                errors.parent().hide();
                data.submit();
            }
        },
        done: function (e, data) {
            var errors = $('#image_upload_widget_error');
            if(data.result['image_upload_file'][0].error) {
                errors.text(data.result['image_upload_file'][0].error);
                errors.parent().show();
            } else {
                errors.text('');
                errors.parent().hide();
                $('#selected_image').val(data.result['image_upload_file'][0].name);
                if (options.cropConfig.disable) {
                    $('#'+id).val(data.result['image_upload_file'][0].name);
                    $('#image_preview_image_'+id).html('<img src="'+options.uploadConfig.webDir + '/' + data.result['image_upload_file'][0].name +'?'+ new Date().getTime()+'" id="'+id+'_preview" alt=""/>');
                    reinitModal();
                    cb({
                        previewSrc: '/' + options.uploadConfig.webDir + '/' + data.result['image_upload_file'][0].name +'?'+ new Date().getTime(),
                        filename: data.result['image_upload_file'][0].name
                    });
                } else {
                    initJCrop(id, options);
                }
            }
            
        },
        progressall: function (e, data) {
            var progress = Math.floor(data.loaded / data.total * 100);
            $('#image_file_upload_progress .progress-bar').css('width', progress + '%');
        },
        fail: function (e, data) {
            console.log(e, data);
        }
    }).prop('disabled', !$.support.fileInput)
        .parent().addClass($.support.fileInput ? undefined : 'disabled');

    var imageCropGoNow = $('#image_crop_go_now');
    imageCropGoNow.unbind('click');
    imageCropGoNow.click(function(){ cropImage(id, options)});
}

function destroyImageManager() {
    $('#image_upload_file').fileupload('destroy');
    destroyJCrop();
    $('#image_crop_go_now').unbind('click');
    $('#image_preview').html('<p>'+comurImageTranslations['Please select or upload an image']+'</p>');
    $('#image_file_upload_progress .progress-bar').css('width', '0%');
    reinitModal();
}

var api;
var c;

function updateCoords(coords) {
    c = coords;
}

function initJCrop(id, options) {
    if(api){
        api.destroy();
    }
    var now = new Date().getTime();

    $('#image_preview img').remove();
    $('#image_preview').html('<img src="/'+options.uploadConfig.webDir + '/'+$('#selected_image').val()+'?'+now+'" id="image_preview_image" alt=""/>');

    $($('#image_preview img')[0]).on('load', function(){

        $('#image_preview img').Jcrop({
            // start off with jcrop-light class
            bgOpacity: 0.8,
            bgColor: 'white',
            addClass: 'jcrop-dark',
            aspectRatio: options.cropConfig.aspectRatio ? options.cropConfig.minWidth/options.cropConfig.minHeight : false ,
            minSize: [ options.cropConfig.minWidth, options.cropConfig.minHeight ],
            boxWidth: 600,
            boxHeight: 400,
            onSelect: updateCoords
        },function(){
            api = this;
            api.setOptions({ bgFade: true });
            api.ui.selection.addClass('jcrop-selection');
        });

        var selectionWidth;
        var selectionHeight;

        var imagePreviewImage = $('#image_preview_image');

        if ((imagePreviewImage.width() / imagePreviewImage.height()) >= (options.cropConfig.minWidth / options.cropConfig.minHeight)) {
            selectionWidth = Math.floor(imagePreviewImage.height() / (options.cropConfig.minHeight / options.cropConfig.minWidth));
            selectionHeight = imagePreviewImage.height();
        } else {
            selectionWidth = imagePreviewImage.width();
            selectionHeight = Math.floor(imagePreviewImage.width() / (options.cropConfig.minWidth / options.cropConfig.minHeight));
        }

        api.setSelect([
            Math.floor((imagePreviewImage.width() - selectionWidth) / 2),
            Math.floor((imagePreviewImage.height() - selectionHeight) / 2),
            selectionWidth,
            selectionHeight
        ]);
        $('#image_crop_go_now').removeClass('hidden');
        $('#image_upload_tabs a:last').tab('show');
    });
}

function cropImage(id, options){
    $('#cropping-loader').show();
    $.ajax({
        url: Routing.generate(options.cropConfig.cropRoute),
        type: 'POST',
        data: {
            'config': JSON.stringify(options),
            'imageName': $('#selected_image').val(), 
            'x': c.x, 
            'y': c.y, 
            'w': c.w, 
            'h': c.h
        },
        success: function(responseData){
            var data = $.parseJSON(responseData);
            var filename = data.filename;
            var previewSrc = data.previewSrc;

            if (options.callback) {
                options.callback(data);
            } else {
                if (typeof galleries[id] != 'undefined') {
                    addImageToGallery(filename, id, data.galleryThumb, options);
                } else {
                    $('#'+id).val(filename);
                    $('#image_preview_image_'+id).html('<img src="'+previewSrc+'?'+ new Date().getTime()+'" id="'+id+'_preview" alt=""/>');
                    if (options.uploadConfig.saveOriginal) {
                        $('#'+options.originalImageFieldId).val($('#selected_image').val());
                        var imagePreviewImage_ID_img = $('#image_preview_image_'+id+' img');
                        imagePreviewImage_ID_img.css('cursor: hand; cursor: pointer;');
                        imagePreviewImage_ID_img.click(function(e){
                            if ($(event.target).is("img")) {
                                $('<div class="modal hide fade"><img src="'+options.uploadConfig.webDir+'/'+$('#selected_image').val()+'" alt=""/></div>').modal();
                                return false;
                            }
                        });
                    }
                    $('#image_preview_'+id).removeClass('hide-disabled');
                }
            }

            destroyJCrop(id);
            reinitModal();
        },
        complete: function() {
            $('#cropping-loader').hide();
        }
    });
}

function reinitModal() {
    $('#selected_image').val('');
    $('#image_preview').html('<p>' + comurImageTranslations['Please select or upload an image'] + '</p>');
    $('#image_crop_go_now').addClass('hidden');
    $('#image_upload_tabs a:first').tab('show');
    $('#image_upload_modal').modal('hide');
}

function addImageToGallery(filename, id, thumb, options) {
    var galleryPreview_ID = $('#gallery_preview_'+id);

    var nb = $('#gallery_preview_'+id+' input').length;
    var name = galleryPreview_ID.data('name');
    galleryPreview_ID.append('<div class="gallery-image-container" data-image="'+filename+'">' +
        '<span class="remove-image"><i class="fa fa-remove"></i></span>' +
        '<span class="gallery-image-helper"></span>' +
        '<input type="text" id="'+id+'_'+nb+'" name="'+name+'['+nb+']" style="padding:0; border: 0; margin: 0; opacity: 0;width: 0; max-width: 0; height: 0; max-height: 0;" value="'+filename+'">' +
        '<img src="/'+options.uploadConfig.webDir + '/' + thumb+'?'+ new Date().getTime()+'" alt=""/>' +
    '</div>');
    rebindGalleryRemove();
}

function removeImageFromGallery(filename, id) {
    // ADD DELETE FILE HERE !
    $('#'+id).parent().remove();
    reorderItems(id);
}

function reorderItems(id) {
    var name = $('#'+id).data('name');
    $('#'+id+' .gallery-image-container').each(function(i, item){
        $(item).find('input').attr('name', name+'['+i+']');
    });
}

function rebindGalleryRemove() {
    var galleryImageContainerSpan = $('.gallery-image-container span');
    galleryImageContainerSpan.unbind('click');
    galleryImageContainerSpan.click(function(){
        removeImageFromGallery($(this).parent().data('image'), $(this).parent().find('input').attr('id'));
        return false; 
    });
}

function destroyJCrop() {
    if(!api){
        return false;
    }
    api.destroy();
    $('#upload_image_crop_go').addClass('hidden');
}
