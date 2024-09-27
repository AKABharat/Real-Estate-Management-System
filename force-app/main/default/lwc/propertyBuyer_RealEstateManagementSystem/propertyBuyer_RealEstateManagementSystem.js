/*
Class Name           : propertyBuyer_RealEstateManagementSystem
Description          : helps in handling client side  propertyBuyer functionality 
Created Date         : 06/06/2024
Modification Date    : 11/06/2024    
Developer Name       : BHARAT DOODI   
*/
import { LightningElement, track } from "lwc";
import personStaticImage from "@salesforce/resourceUrl/PersonImage";
import total_Property from "@salesforce/resourceUrl/total_Property";
import total_Enquiry from "@salesforce/resourceUrl/total_Enquiry";
import handleProAndEnqOfOwner from "@salesforce/apex/RealEstateManagementController.handleProAndEnqOfOwner";
import showInquiriesHandleMethod from "@salesforce/apex/RealEstateManagementController.showInquiriesHandleMethod";
import deletePropertyMethod from "@salesforce/apex/RealEstateManagementController.deletePropertyMethod";
import showEnquiryMethod from "@salesforce/apex/RealEstateManagementController.showEnquiryMethod";
import deleteEnquiryMethod from "@salesforce/apex/RealEstateManagementController.deleteEnquiryMethod";
import getDetailsMethod from "@salesforce/apex/RealEstateManagementController.getDetailsMethod";
import { NavigationMixin } from "lightning/navigation";

export default class PropertyBuyer_RealEstateManagementSystem extends LightningElement {
  @track propertyBuyer = [];
  @track ProBuyerId;
  @track ProBuyerEmailId;
  @track inquiries = [];
  @track propertyBuyerFlag = false;
  @track showPropertiesFlag = false;
  @track showEnquiryFlag = false;
  @track properties = [];
  @track enquiryID;
  @track propertyID;
  @track propertyWindow = false;
  @track enquiryWindow = false;
  total_Enquiry = total_Enquiry;
  total_Property = total_Property;
  personStaticImage = personStaticImage;
  @track showSpinner = false;

  connectedCallback() {
    this.getpropertyBuyerDetails();
  }

  getpropertyBuyerDetails() {
    this.showSpinner = true;
    getDetailsMethod()
      .then((result) => {
        if (result == undefined || result.length == 0) {
          this[NavigationMixin.Navigate]({
            type: "comm__namedPage",
            attributes: {
              name: "login",
            },
          });
        } else {
          var ProBuyer = result[0];
          this.propertyBuyer = {
            ProBuyer_Name: ProBuyer.Name,
            ProBuyer_mobileNo: ProBuyer.MobilePhone,
            ProBuyer_EmailId: ProBuyer.Email,
            ProBuyerId: ProBuyer.Id,
          };
          this.ProBuyerId = ProBuyer.Id;
          (this.ProBuyerEmailId = ProBuyer.Email),
            (this.propertyBuyerFlag = true);
          this.showPropertiesAndEnquiriesHandle();
          //    this.showInquiriesHandle();
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
        this.showSpinner = false;
      });
  }

  showPropertiesAndEnquiriesHandle() {
    this.showSpinner = true;
    handleProAndEnqOfOwner({ ProBuyerEmailId: this.ProBuyerEmailId })
      .then((result) => {
        this.properties = [];
        this.inquiries = [];
        if (result) {
          let num = 1;
          let seqNo = 1;
          for (let enquiry of result) {
            this.inquiries.push({
              seqNo: seqNo++,
              enquiryId: enquiry.Id,
              Name: enquiry.Name,
              enquiryName: enquiry.Enquiry_Name__c,
              enquiryPhone: enquiry.Enquiry_Phone__c,
              enquiryEmail: enquiry.Enquiry_Email__c,
              enquiryCreatedDate: enquiry.Enquiry_Created_Date__c,
              enquiryMessage: enquiry.Enquiry_Message__c,
            });
            let pro = enquiry.Property__r;
            //  for (let pro of Property__r) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(
              pro.Property_Photos__c,
              "text/html"
            );
            const imgElement = doc.querySelector("img");
            const imageUrl = imgElement ? imgElement.src : "";
            this.properties.push({
              seqNo: num++,
              Title: pro.Property_Title__c,
              Name: pro.Name,
              type: pro.Property_Type__c,
              city: pro.Property_City__c,
              image: imageUrl,
              propertyId: pro.Id,
              BHK: pro.BHK__c,
            });
          }
        }
        //  this.showPropertiesFlag=true;
        else {
          this.ShowToast(
            "Warning",
            "No Property exists, Please create a new Property",
            "warning",
            "dismissable"
          );
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
        this.showSpinner = false;
      });
  }

  handleView(event) {
    this.showSpinner = true;
    const enquiryId = event.target.dataset.id;
    this.enquiryID = enquiryId;
    this.enquiryWindow = true;
    this.showSpinner = false;
  }

  handleEnqDelete(event) {
    this.showSpinner = true;
    const enquiryId = event.target.dataset.id;
    deleteEnquiryMethod({ enquiryId: enquiryId })
      .then((result) => {
        this.showToast(
          "Success",
          `Enquiry deleted successfully`,
          "success",
          "dismissable"
        );
        this.showPropertiesAndEnquiriesHandle();
      })
      .catch((error) => {
        this.showToast(
          "Error",
          `Enquiry deletion failed`,
          "error",
          "dismissable"
        );
      })
      .finally(() => {
        this.showSpinner = false;
      });
  }

  handleShow(event) {
    this.showSpinner = true;
    const propertyId = event.target.dataset.id;
    this.propertyID = propertyId;
    this.propertyWindow = true;
    this.showSpinner = false;
  }

  showPropertyOnSite() {
    this[NavigationMixin.Navigate]({
      type: "comm__namedPage",
      attributes: {
        name: "propertydetail__c",
      },
      state: {
        propertyId: this.propertyID,
      },
    });
  }
  showPropertyPopUpClose() {
    this.propertyWindow = false;
  }

  showEnquiryPopUpClose(){
    this.enquiryWindow=false;
  }
  handleProDelete(event) {
    this.showSpinner = true;
    const propertyId = event.target.dataset.id;
    deletePropertyMethod({ propertyId: propertyId })
      .then((result) => {
        this.showToast(
          "Success",
          "Property deleted successfully",
          "success",
          "dismissable"
        );
        this.showPropertiesAndEnquiriesHandle();
      })
      .catch((error) => {
        this.showToast(
          "Error",
          `Property deletion failed`,
          "error",
          "dismissable"
        );
      })
      .finally(() => {
        this.showSpinner = false;
      });
  }

  uploadPropertyRedirect() {
    this[NavigationMixin.Navigate]({
      type: "comm__namedPage",
      attributes: {
        name: "uploadProperty__c",
      },
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