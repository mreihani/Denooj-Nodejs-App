$(document).ready(function() {
    function submitForm() {
        
        const form = $('#login-form');
        const formData = form.serialize(); // Serialize the form data

        $.ajax({
            type: 'POST',
            url: '/admin/login',
            data: formData,
            dataType: 'json',
            success: function(response) {
                if(response.status = 'success') {
                    if(response.twoFactorAuth) {
                        $('#login-form').hide();
                        $("#verification-code-form").removeClass('d-none');
                        $('#temporary-phone').val(response.phone); 
                    } else {
                        if(!response.errors || !response.errors.length) {
                            window.location.href = "/admin/dashboard";
                        }
                    }
                }

                if(response.errors && response.errors.length) {
                    const errorsArray = response.errors;
                   
                    let errorsHtml = "";
                    errorsArray.forEach(errorItem => {
                        errorsHtml += `
                            <div class="alert alert-danger" role="alert">
                                ${errorItem.msg}
                            </div>  
                        `;
                    });

                    $('#error-field').empty();
                    $('#error-field').append(errorsHtml);
                }
            },
        });
    }

    $('#ajax-submit-button').on('click', function(e) {
        e.preventDefault(); // Prevent the default form submission
        submitForm();
    });

    $('#login-form').on('keypress', function(e) {
        if (e.which === 13) { // Enter key pressed
            e.preventDefault(); // Prevent the default form submission
            submitForm();
        }
    });
});

$(document).ready(function() {
    function submitVerificationForm() {
        const form = $('#verification-code-form');
        const formData = form.serialize(); // Serialize the form data

        $.ajax({
            type: 'POST',
            url: '/admin/login/verify',
            data: formData,
            dataType: 'json',
            success: function(response) {
                if(!response.errors || !response.errors.length) {
                    window.location.href = "/admin/dashboard";
                }

                if(response.errors && response.errors.length) {
                    
                    const errorsArray = response.errors;
                   
                    let errorsHtml = "";
                    errorsArray.forEach(errorItem => {
                        errorsHtml += `
                            <div class="alert alert-danger" role="alert">
                                ${errorItem.msg}
                            </div>  
                        `;
                    });
                   
                    $('#error-field-sms-verify').empty();
                    $('#error-field-sms-verify').append(errorsHtml);
                }
            },
        });
    }

    $('#verification-code-submit-button').on('click', function(e) {
        e.preventDefault(); // Prevent the default form submission
        submitVerificationForm();
    });

    $('#verification-code-form').on('keypress', function(e) {
        if (e.which === 13) { // Enter key pressed
            e.preventDefault(); // Prevent the default form submission
            submitVerificationForm();
        }
    });
});