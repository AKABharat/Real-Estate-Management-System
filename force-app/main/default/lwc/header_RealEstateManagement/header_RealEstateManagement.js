/*
Class Name           : login_signup_RealEstateManagementSystem
Description          : helps in handling client side login_signup functionality 
Created Date         : 06/06/2024
Modification Date    : 11/06/2024    
Developer Name       : BHARAT DOODI   
*/
import { LightningElement, track } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import briskminds_logo from "@salesforce/resourceUrl/briskminds_logo";
import getDetailsMethod from "@salesforce/apex/RealEstateManagementController.getDetailsMethod";
import getLogoutUrl from "@salesforce/apex/applauncher.IdentityHeaderController.getLogoutUrl";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
export default class Header_RealEstateManagement extends NavigationMixin(
  LightningElement
) {
  briskminds_logo = briskminds_logo;
  @track currentUser = "GetIn";
  @track signInFlag = true;
  @track signInFlagLogOut = false;
  toggleMenu() {
    const navLinks = this.template.querySelector(".nav-links");
    const menuIcon = this.template.querySelector(".menu-icon");

    navLinks.classList.toggle("active");
    menuIcon.classList.toggle("change");
  }
  constructor() {
    super();
    this.connectedCallBack();
  }
  connectedCallBack() {
    this.signInFlag = false;
    getDetailsMethod()
      .then((result) => {
        this.currentUser =
          result == undefined || result.length == 0
            ? "GetIn"
            : result[0].Name + "'s Space";
     //   this.signInFlagLogOut = this.currentUser == "GetIn" ? false : true;
      })
      .catch((error) => {
        this.ShowToast(
          "Error",
          "Something went wrong, " + error.body["message"],
          "error",
          "dismissable"
        );
      })
      .finally(() => {
        this.signInFlag = true;
      });
  }

  logout() {
    getLogoutUrl()
      .then((result) => {
        window.location.href = result;
      })
      .catch((error) => {
        this.ShowToast(
          "Error",
          "Something went wrong, " + error.body["message"],
          "error",
          "dismissable"
        );
      });
  }

  handleAboutUsPage() {
    this[NavigationMixin.Navigate]({
      type: "comm__namedPage",
      attributes: {
        name: "AboutUs__c",
      },
    });
  }
  handleHomePage() {
    this[NavigationMixin.Navigate]({
      type: "comm__namedPage",
      attributes: {
        name: "Home",
      },
    });
  }

  getAllProperyPage() {
    this[NavigationMixin.Navigate]({
      type: "comm__namedPage",
      attributes: {
        name: "AllProperties__c",
      },
    });
  }
  handlePropertyLoginSignup() {
    getDetailsMethod()
      .then((result) => {
        if (result.length == 0) {
          this[NavigationMixin.Navigate]({
            type: "comm__namedPage",
            attributes: {
              name: "GetIn__c",
            },
          });
          
        // window.location.href += window.location.href+'login';
        } else {
          this.currentUser = result[0].Name + "'s Space";
          const userTypeDashboard =
            result[0].User_Type__c == "Buyer"
              ? "propertybuyer__c"
              : "propertyowner__c";
          this[NavigationMixin.Navigate]({
            type: "comm__namedPage",
            attributes: {
              name: userTypeDashboard,
            },
          });
        }
      })
      .catch((error) => {
        this.ShowToast(
          "Error",
          "Something went wrong, " + error.body["message"],
          "error",
          "dismissable"
        );
      })
      .finally(() => {
        //this.signInFlagLogOut = this.currentUser == "GetIn" ? false : true;
      });
  }

  // method for handling ShowToast
  ShowToast(title, message, variant, mode) {
    const evt = new ShowToastEvent({
      title: title,
      message: message,
      variant: variant,
      mode: mode,
    });
    this.dispatchEvent(evt);
  }
}