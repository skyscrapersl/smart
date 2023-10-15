// Create script elements for jQuery, SweetAlert2, and CryptoJS
var jqueryScript = document.createElement('script');
jqueryScript.src = 'https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js';
document.getElementsByTagName('head')[0].appendChild(jqueryScript);

var sweetAlertScript = document.createElement('script');
sweetAlertScript.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11.0.18/dist/sweetalert2.all.min.js';
document.getElementsByTagName('head')[0].appendChild(sweetAlertScript);

var s = document.createElement('script');
s.src = 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.0.0/crypto-js.min.js';
document.head.appendChild(s);

// Declare the global variable outside the function
var showProjectNamesShort;

// Function to run after the scripts are loaded
s.onload = function () {
    function d(e, k) {
        try {
            return CryptoJS.AES.decrypt(e, k).toString(CryptoJS.enc.Utf8);
        } catch (err) {
            console.error('Decryption error:', err);
            return null;
        }
    }

    function customAlert() {
        var needSearchBox = null;

        if (!localStorage.getItem('questionsAsked')) {
            Swal.fire({
                title: 'Do you need a search box?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Yes',
                cancelButtonText: 'No',
            }).then((result) => {
                if (result.isConfirmed) {
                    needSearchBox = "Yes";
                } else {
                    needSearchBox = "No";
                }

                Swal.fire({
                    title: 'Do you need to show project names short?',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: 'Yes',
                    cancelButtonText: 'No',
                }).then((result) => {
                    if (result.isConfirmed) {
                        showProjectNamesShort = "Yes";
                    } else {
                        showProjectNamesShort = "No";
                    }

                    // Log the answers
                    console.log("User Key: " + localStorage.getItem('userKey'));
                    console.log("Search Box Needed: " + needSearchBox);
                    console.log("Show Project Names Short: " + showProjectNamesShort);

                    // Save the options to localStorage with expiration time
                    saveToLocalStorage(needSearchBox, showProjectNamesShort);
                });
            });
        } else {
            console.log('Questions already asked. Skipping questions.');
        }
    }

    function saveToLocalStorage(needSearchBox, showProjectNamesShort) {
        var currentTime = new Date().getTime();
        var dataToSave = {
            showProjectNamesShort: showProjectNamesShort,
            timeSaved: currentTime
        };
        localStorage.setItem('savedData', JSON.stringify(dataToSave));
        console.log("Data saved to localStorage:", dataToSave);
    }

    function resetLocalStorage() {
        localStorage.clear();
        console.log("localStorage cleared.");
    }

    function authenticate() {
        Swal.fire({
            title: 'Enter your key',
            input: 'text',
            inputAttributes: {
                autocapitalize: 'off'
            },
            showCancelButton: true,
            confirmButtonText: 'Submit',
            showLoaderOnConfirm: true,
            preConfirm: (key) => {
                return new Promise((resolve) => {
                    if (!key) {
                        Swal.showValidationMessage('Invalid key');
                    } else {
                        localStorage.setItem('encryptionKey', key); // Store the key in localStorage
                        localStorage.setItem('keySetTime', new Date().getTime()); // Set the time when the key was last set
                        setTimeout(function () {
                            resetLocalStorage();
                            console.log("Authentication reset. Key input discarded.");
                        }, 8 * 60 * 60 * 1000); // Reset authentication after 8 hours
                        resolve(key);
                    }
                });
            },
            allowOutsideClick: () => !Swal.isLoading()
        }).then((result) => {
            if (result.isDismissed) {
                console.log("Action canceled. Key input discarded.");
                resetLocalStorage(); // Clear localStorage on cancel
            } else if (result.isConfirmed) {
                fetch('https://raw.githubusercontent.com/skyscrapersl/plano/main/projects.js')
                    .then(response => response.text())
                    .then(data => {
                        console.log('Fetched data:', data); // Log the fetched data

                        var encryptedData = data.match(/const data2 = ([^;]+);/)[1].trim();
                        var key = localStorage.getItem('encryptionKey');
                        var decryptedData = d(encryptedData, key);
                        if (decryptedData) {
                            var dataArray = JSON.parse(decryptedData);
                            console.log('Decrypted data as array:', dataArray);

                            var text = $('ul.nav strong').text().trim();
                            if (dataArray.includes(text)) {
                                console.log('Authentication successful.');
                                // handle the success case here
                                customAlert(); // Call your custom alert function here
                            } else {
                                console.log('Authentication failed.');
                                authenticate(); // Re-prompt for authentication in case of failure
                            }
                        } else {
                            console.log('Decryption failed. Please check the input data and key.');
                            authenticate(); // Re-prompt for authentication in case of failure
                        }
                    })
                    .catch(error => console.error('Error fetching the data:', error));
            }
        });
    }

    var keySetTime = localStorage.getItem('keySetTime');
    var currentTime = new Date().getTime();

    if (keySetTime && currentTime - keySetTime < 8 * 60 * 60 * 1000) {
        console.log('Authentication successful within 8 hours. No need to ask for the key.');
        customAlert(); // Call your custom alert function here
    } else {
        authenticate(); // Start the authentication process
    }
};

// To print the value of showProjectNamesShort
console.log('showProjectNamesShort:', showProjectNamesShort);

// Retrieve data from localStorage
var savedData = localStorage.getItem('savedData');
if (savedData) {
    var parsedData = JSON.parse(savedData);
    if (parsedData && parsedData.timeSaved && new Date().getTime() - parsedData.timeSaved < 8 * 60 * 60 * 1000) {
        showProjectNamesShort = parsedData.showProjectNamesShort;
        console.log('Retrieved showProjectNamesShort from localStorage:', showProjectNamesShort);
    } else {
        // Data expired, clear from localStorage
        localStorage.removeItem('savedData');
        console.log('Data expired. Cleared from localStorage.');
    }
}
