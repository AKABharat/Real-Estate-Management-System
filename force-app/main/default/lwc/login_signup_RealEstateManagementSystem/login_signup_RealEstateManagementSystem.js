/*
Class Name           : login_signup_RealEstateManagementSystem
Description          : helps in handling client side  allProperties functionality 
Created Date         : 06/06/2024
Modification Date    : 11/06/2024    
Developer Name       : BHARAT DOODI   
*/
import { LightningElement, track } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import loginUser from '@salesforce/apex/RealEstateManagementController.loginUser';
import registerUser from '@salesforce/apex/RealEstateManagementController.registerUser';
import verifyUser from '@salesforce/apex/RealEstateManagementController.verifyUser';
import userExistenceHandle from '@salesforce/apex/RealEstateManagementController.userExistenceHandle';
export default class Login_signup_RealEstateManagementSystem extends NavigationMixin(LightningElement) {
    @track loginEmailId = "";
    @track loginPassword = "";
    @track signupMobileNo = "";
    @track signupUserFirstName = "";
    @track signupUserLastName = "";
    @track signupEmailId = "";
    @track password = "";
    @track showSpinner = false;
    @track userType = '';
    @track authorsizePopUp=false;
    @track optTimer = 60;
    @track otpResendFlag=false;
    @track verifyOtpValue='';
    @track otpValueFlag=true;
    @track showTimer=true;
    @track otpValue='';
    intervalId;
    @track avoidMultipleOtpFlag=false;
    /*get options() {
        return [
            { label: 'Sell Property', value: 'Seller' },
            { label: 'Buy Property', value: 'Buyer' },
        ];
    }*/

    loginInputHandle(event) {
        var targetName = event.target.name;
        var targetValue = event.target.value;
        if (targetName == 'loginpassword') this.loginPassword = targetValue;
        else if (targetName == 'loginemailid') this.loginEmailId = targetValue;
    }

    authorizeClosePopUp(){
        this.authorsizePopUp=false;
    }

    authorizeOpenPopUp(){
        this.authorsizePopUp=true;
        this.renderedCallBack();
        
    }

    renderedCallBack(){
        if (this.optTimer > 0) {
            this.startTimer();
        } else {
            this.showTimer=false;
            this.stopTimer();
        }
 
    }


    startTimer() {
        if (!this.intervalId) { // Only start a new timer if one is not already running
            this.intervalId = setInterval(() => {
                if (this.optTimer > 0) {
                    this.optTimer -= 1;
                } else {
                    this.otpResendFlag = false; // Hide resend flag when timer reaches 0
                    this.stopTimer(); // Stop the timer
                }
            }, 1000); // Update every second
        }
    }

    stopTimer() {
        clearInterval(this.intervalId); // Clear the timer
        this.intervalId = null; // Reset the interval ID
    }

    disconnectedCallback() {
        this.stopTimer(); // Clean up when the component is removed
    }

    resendOtpHandle(){
        this.authorizeClosePopUp();
        this.otpValueFlag=true;
        this.showTimer=true;
        this.optTimer=60;
        this.authorizeOpenPopUp();
        this.authenticationUser();
    }

    signupInputHandle(event) {
        var targetName = event.target.name;
        var targetValue = event.target.value;

        if (targetName == 'userfirstname') this.signupUserFirstName = targetValue;
        else if (targetName == 'userlastname') this.signupUserLastName = targetValue;
        else if (targetName == 'signupemailid') this.signupEmailId = targetValue;
        else if (targetName == 'signupmobileno') this.signupMobileNo = targetValue;
        else if (targetName == 'password') this.password = targetValue;
      //  else this.userType = targetValue;
    }

    // Email validation function
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Name validation function (alphabetic only)
    validateName(name) {
        return /^[a-zA-Z\s]+$/.test(name);
    }

    // Mobile number validation function (10 digits)
    validatePhone(phone) {
        return /^\d{10}$/.test(phone);
    }


    generateRandomAlphanumeric(length = 7) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
    
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            result += characters[randomIndex];
        }
    
        return result;
    }


    checkUserExistence(email){
        userExistenceHandle({email : email})
        .then(result => {
            if(result==true){
                this.ShowToast('Warning', 'User already exists, Please sign in.', 'warning');
            }
            else{
                this.authorizeOpenPopUp();
               this.authenticationUser();
          }
        })
        .catch(error => {
            this.ShowToast('Error', 'Something went wrong: ' + error.body["message"], 'error');
        })
    }

    // Signup Handler with validation
    signUpHandle() {

        // Check if all fields are filled
        if (this.signupUserFirstName === '' || this.signupUserLastName === '' || this.signupEmailId === ''  || this.signupMobileNo === '' || this.password === '') {
            this.ShowToast('Warning', 'Please fill all the fields', 'warning');
            this.showSpinner = false;
            return;
        }

        // Validate name
        if (!this.validateName(this.signupUserFirstName) || !this.validateName(this.signupUserLastName)) {
            this.ShowToast('Warning', 'Name should contain alphabets only', 'warning');
            this.showSpinner = false;
            return;
        }

        if (this.password.length < 8) {
            this.ShowToast('Warning', 'Password should be atleast 8 characters long', 'warning');
            this.showSpinner = false;
            return;
        }

        if (!this.validateName(this.signupUserFirstName) || !this.validateName(this.signupUserLastName)) {
            this.ShowToast('Warning', 'Name should contain alphabets only', 'warning');
            this.showSpinner = false;
            return;
        }

        // Validate email
        if (!this.validateEmail(this.signupEmailId)) {
            this.ShowToast('Warning', 'Invalid Email ID', 'warning');
            this.showSpinner = false;
            return;
        }

        // Validate mobile number
        if (!this.validatePhone(this.signupMobileNo)) {
            this.ShowToast('Warning', 'Invalid Mobile Number. It should be 10 digits.', 'warning');
            this.showSpinner = false;
            return;
        }

       
        this.checkUserExistence(this.signupEmailId);

        // All validations passed, register user
    }



    authenticationUser(){
      //  this.otpValue =  this.generateRandomAlphanumeric();
     if(this.otpValueFlag && !this.otpResendFlag){
        this.otpValue =  this.generateRandomAlphanumeric();
      verifyUser({signupEmailId : this.signupEmailId , otpValue : this.otpValue})
       .then((result)=>{
            this.otpValueFlag = false;
            this.otpResendFlag=true;
            this.ShowToast('Success', 'OTP Sent to email Id :'+this.signupEmailId, 'success');
        })
        .catch((error)=>{
            this.ShowToast('Error', 'Something went wrong: '+error.body["message"], 'error');
       });
        }
    }


    registerNewUser(){
        registerUser({
            firstName: this.signupUserFirstName,
            lastName: this.signupUserLastName,
            email: this.signupEmailId,
           // userType: this.userType,
            mobileNumber: this.signupMobileNo,
            password : this.password,
        })
            .then(result => {
                if(result == 'User exists'){
                    this.ShowToast('Warning', 'User already exists', 'warning');
                }
                else if(result.includes('User registered successfully as')) {
                    this.authorizeClosePopUp();
                    this.ShowToast('Success', result, 'success');
                } else {
                    this.ShowToast('Warning', result, 'warning');
                }
            })
            .catch(error => {
                console.log(error);
                console.log('----------------');
                console.log('Error: ' + error.body["message"]);
                this.ShowToast('Error', 'Something went wrong', 'error');
            })
            .finally(() => {
                // Reset form fields if needed
                this.signupUserFirstName = '';
                this.signupUserLastName = '';
                this.signupEmailId = '';
                this.signupMobileNo = '';
                this.userType = '';
                this.showSpinner = false;
            });
        
    }
    VerifyOtpHandle(){
        console.log(this.verifyOtpValue);
        console.log(this.otpValue);
        console.log(this.verifyOtpValue = this.otpValue);
        this.verifyOtpValue = this.otpValue;
        if(this.verifyOtpValue !='' && this.otpValue === this.verifyOtpValue){
            this.ShowToast('Success', 'OTP verified', 'success');
            this.authorizeClosePopUp();
            this.registerNewUser();
        }
        else{
            this.ShowToast('Warning', 'Invalid OTP', 'warning');
        }
    }
    // Sign In Handler with basic validation
    signInHandle() {
        this.showSpinner = true;

        // Check if fields are filled
        if (this.loginEmailId === '' || this.loginPassword === '') {
            this.ShowToast('Warning', 'Please fill in both email and password', 'warning');
            this.showSpinner = false;
            return;
        }

        // Validate email
        if (!this.validateEmail(this.loginEmailId)) {
            this.ShowToast('Warning', 'Invalid Email ID', 'warning');
            this.showSpinner = false;
            return;
        }

        loginUser({
            email: this.loginEmailId,
            password: this.loginPassword,
            directUrl: 'https://briskmindssoftwaresoluti-fb-dev-ed.develop.my.site.com/RealEstateManagementAssignment/s/'
        })
            .then(result => {
                if (result.includes('Invalid login credentials')) {
                    this.ShowToast('Warning', 'Please Signup. You are not registered or '+result, 'warning');
                }
                else {
                    this.ShowToast('Success', 'SignIn Successful, Redirecting to the Dashboard', 'success');
                    window.location.href=result;
                }
            })
            .catch(error => {
                this.ShowToast('Error', 'Something went wrong: ' + error.body["message"], 'error');
            })
            .finally(() => {
                this.showSpinner = false;
            });
    }


    handleOtpEnter(event){
        this.verifyOtpValue = event.target.value;
    }

    // Method for handling ShowToast
    ShowToast(title, message, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(evt);
    }
}