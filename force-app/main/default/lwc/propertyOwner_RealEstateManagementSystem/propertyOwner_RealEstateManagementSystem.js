/*
Class Name           : propertyOwner_RealEstateManagementSystem
Description          : helps in handling client side  propertyOwner functionality 
Created Date         : 06/06/2024
Modification Date    : 11/06/2024    
Developer Name       : BHARAT DOODI   
*/
import { LightningElement, wire, track, api } from "lwc";
import { CurrentPageReference } from "lightning/navigation";
import personStaticImage from "@salesforce/resourceUrl/PersonImage";
import total_Property from "@salesforce/resourceUrl/total_Property";
import total_Enquiry from "@salesforce/resourceUrl/total_Enquiry";
import upload_property from "@salesforce/resourceUrl/upload_property";
import showPropertiesHandleMethod from "@salesforce/apex/RealEstateManagementController.showPropertiesHandleMethod";
import showInquiriesHandleMethod from "@salesforce/apex/RealEstateManagementController.showInquiriesHandleMethod";
import deletePropertyMethod from "@salesforce/apex/RealEstateManagementController.deletePropertyMethod";
import showEnquiryMethod from "@salesforce/apex/RealEstateManagementController.showEnquiryMethod";
import deleteEnquiryMethod from "@salesforce/apex/RealEstateManagementController.deleteEnquiryMethod";
import getDetailsMethod from "@salesforce/apex/RealEstateManagementController.getDetailsMethod";
import { NavigationMixin } from "lightning/navigation";
export default class PropertyOwner_RealEstateManagementSystem extends NavigationMixin(
  LightningElement
) {
  @track propertyOwner = [];
  @track proOwnerId;
  @track inquiries = [];
  @track propertyOwnerFlag = false;
  @track showPropertiesFlag = false;
  @track showEnquiryFlag = false;
  @track properties = [];
  @track enquiryID;
  @track propertyID;
  @track propertyWindow = false;
  @track enquiryWindow = false;
  @track showSpinner = false;
  total_Enquiry = total_Enquiry;
  total_Property = total_Property;
  upload_property = upload_property;
  personStaticImage = personStaticImage;
  @wire(CurrentPageReference)
  setCurrentPageReference(pageRef) {
    if (pageRef.state.propertyOwnerId) {
      this.getPropertyOwnerDetails();
    }
  }

  connectedCallback() {
    this.getPropertyOwnerDetails();
  }

  showEnquiryPopUpClose(){
    this.enquiryWindow=false;
  }
  getPropertyOwnerDetails() {
    this.showSpinner = false;
    getDetailsMethod()
      .then((result) => {
        if (result.length == 0) {
          this[NavigationMixin.Navigate]({
            type: "comm__namedPage",
            attributes: {
              name: "Login",
            },
          });
        } else {
          var proOwner = result[0];
          this.propertyOwner = {
            ProOwner_Name: proOwner.Name,
            ProOwner_mobileNo: proOwner.MobilePhone,
            ProOwner_EmailId: proOwner.Email,
            proOwnerId: proOwner.Id,
          };
          this.proOwnerId = proOwner.Id;
          this.propertyOwnerFlag = true;
          this.showPropertiesHandle();
          this.showInquiriesHandle();
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

  showPropertiesHandle() {
    this.showSpinner = true;
    showPropertiesHandleMethod({ proOwnerId: this.proOwnerId })
      .then((result) => {
        this.properties = [];
        if (result) {
          let num = 1;
          for (let pro of result) {
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
        } else {
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

  showInquiriesHandle() {
    this.showSpinner = true;
    showInquiriesHandleMethod({ proOwnerId: this.proOwnerId })
      .then((result) => {
        let seqNo = 1;
        if (result) {
          this.inquiries = [];
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
          }
        } else {
          this.ShowToast(
            "Warning",
            "No Enquiry exists",
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
        ).finally(() => {
          this.showSpinner = false;
        });
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
        this.showInquiriesHandle();
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
        this.showPropertiesHandle();
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