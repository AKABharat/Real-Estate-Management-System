/*
Class Name           : uploadProperty
Description          : helps in handling client side  uploadProperty functionality 
Created Date         : 06/06/2024
Modification Date    : 11/06/2024    
Developer Name       : BHARAT DOODI   
*/
import { LightningElement, track, api } from "lwc";
import getDetailsMethod from "@salesforce/apex/RealEstateManagementController.getDetailsMethod";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import createProperty from "@salesforce/apex/RealEstateManagementController.createProperty";
import { NavigationMixin } from "lightning/navigation";
export default class UploadProperty extends NavigationMixin(LightningElement) {
  @track title = "";
  @track propertyType = "";
  @track propertyCity = "";
  @track bhk = 0;
  @track area = 0;
  @track images = "";
  @track address = "";
  @track floor = 0;
  @track parking = false;
  @track pipedGas = false;
  @track zipCode = 0;
  @track facingDirection = "";
  @track yearBuilt = 0;
  @track price = 0.0;
  @track bookingFee = 0.0;
  @track description = "";
  @track errorMessage = "";
  @track successMessage = "";
  @track propertyOwnerId = "";
  @track showSpinner = false;
  @api recordId;
  @track fileData = {};
  typeOptions = [
    { label: "Apartment", value: "Apartment" },
    { label: "Flat", value: "Flat" },
    { label: "Villa", value: "Villa" },
  ];

  cityTypeOptions = [
    { label: "Jaipur", value: "Jaipur" },
    { label: "Dehradun", value: "Dehradun" },
    { label: "Mumbai", value: "Mumbai" },
    { label: "New Delhi", value: "New Delhi" },
  ];

  propertyDirections = [
    { label: "East", value: "East" },
    { label: "West", value: "West" },
    { label: "North", value: "North" },
    { label: "South", value: "South" },
    { label: "South-West", value: "South-West" },
    { label: "North-West", value: "North-West" },
    { label: "North-East", value: "North-East" },
    { label: "South-East", value: "South-East" },
  ];

  connectedCallback() {
    getDetailsMethod()
      .then((result) => {
        if (result == undefined || result.length == 0) {
          this[NavigationMixin.Navigate]({
            type: "comm__namedPage",
            attributes: {
              name: "GetIn__c",
            },
          });
        } else this.propertyOwnerId = result[0].Id;
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

  handleInputChange(event) {
    const field = event.target.dataset.id;
    if (field === "title") this.title = event.target.value;
    else if (field === "propertyType") this.propertyType = event.target.value;
    else if (field === "propertyCity") this.propertyCity = event.target.value;
    else if (field === "bhk") this.bhk = event.target.value;
    else if (field === "area") this.area = event.target.value;
    else if (field === "images") this.images = event.target.value;
    else if (field === "address") this.address = event.target.value;
    else if (field === "floor") this.floor = event.target.value;
    else if (field === "parking") this.parking = event.target.checked;
    else if (field === "pipedGas") this.pipedGas = event.target.checked;
    else if (field === "zipCode") this.zipCode = event.target.value;
    else if (field === "facingDirection")
      this.facingDirection = event.target.value;
    else if (field === "yearBuilt") this.yearBuilt = event.target.value;
    else if (field === "price") this.price = event.target.value;
    else if (field === "bookingFee") this.bookingFee = event.target.value;
    else if (field === "description") this.description = event.target.value;
  }

  openfileUpload(event) {
    this.showSpinner = true;
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      const base64 = reader.result.split(",")[1];
      this.fileData = { filename: file.name, base64: base64 };
    };
    reader.readAsDataURL(file);
    this.showSpinner = false;
  }
/*
  async handleUpload() {
    this.showSpinner = true;
    const property = {
      Title: this.title,
      propertyType: this.propertyType,
      propertyCity: this.propertyCity,
      BHK: this.bhk,
      Area: this.area,
      // Images: this.images,
      Address: this.address,
      Floor: this.floor,
      Parking: this.parking,
      PipedGas: this.pipedGas,
      ZipCode: this.zipCode,
      FacingDirection: this.facingDirection,
      YearBuilt: this.yearBuilt,
      Price: this.price,
      BookingFee: this.bookingFee,
      Description: this.description,
    };

    const { base64, filename } = this.fileData;
    await createProperty({
      propertyDTORecord: JSON.stringify(property),
      propertyOwnerId: this.propertyOwnerId,
      base64: base64,
      filename: filename,
      recordId: this.recordId,
    })
      .then((result) => {
        //success
        this.ShowToast("Success", result, "success", "dismissable");
        this.handlePropertyLoginSignup();
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
        this.clearForm();
        this.showSpinner = false;
      });
  }

  handlePropertyLoginSignup() {
    this[NavigationMixin.Navigate]({
      type: "comm__namedPage",
      attributes: {
        name: "propertyowner__c",
      },
    });
  }

  clearForm() {
    this.title = "";
    this.propertyType = "";
    this.propertyCity = "";
    this.bhk = 0;
    this.area = 0;
    this.images = "";
    this.address = "";
    this.floor = 0;
    this.parking = false;
    this.pipedGas = false;
    this.zipCode = 0;
    this.facingDirection = "";
    this.yearBuilt = 0;
    this.price = 0.0;
    this.bookingFee = 0.0;
    this.description = "";
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
}*/

async handleUpload() {
  // Clear previous error message
  this.errorMessage = "";
  
  // Validation for required fields
  if (!this.title || !this.propertyType || !this.propertyCity || 
      !this.address || !this.facingDirection || !this.description) {
      this.errorMessage = "Please fill out all required fields.";
      return;
  }

  // Validate number fields
  if (isNaN(this.bhk) || this.bhk <= 0) {
      this.errorMessage = "Please enter a valid number of BHK.";
      return;
  }

  if (isNaN(this.area) || this.area <= 0) {
      this.errorMessage = "Please enter a valid area in square feet.";
      return;
  }

  if (isNaN(this.zipCode) || this.zipCode.length !== 5) {
      this.errorMessage = "Please enter a valid 5-digit Zip Code.";
      return;
  }

  if (isNaN(this.yearBuilt) || this.yearBuilt <= 1800 || this.yearBuilt > new Date().getFullYear()) {
      this.errorMessage = "Please enter a valid year for Year Built.";
      return;
  }

  if (isNaN(this.price) || this.price <= 0) {
      this.errorMessage = "Please enter a valid price.";
      return;
  }

  if (isNaN(this.bookingFee) || this.bookingFee < 0) {
      this.errorMessage = "Please enter a valid booking fee.";
      return;
  }

  if (isNaN(this.floor) || this.floor < 0) {
      this.errorMessage = "Please enter a valid floor number.";
      return;
  }

  // If all validations pass, proceed with form submission
  this.showSpinner = true;
  const property = {
      Title: this.title,
      propertyType: this.propertyType,
      propertyCity: this.propertyCity,
      BHK: this.bhk,
      Area: this.area,
      Address: this.address,
      Floor: this.floor,
      Parking: this.parking,
      PipedGas: this.pipedGas,
      ZipCode: this.zipCode,
      FacingDirection: this.facingDirection,
      YearBuilt: this.yearBuilt,
      Price: this.price,
      BookingFee: this.bookingFee,
      Description: this.description,
  };

  const { base64, filename } = this.fileData;
  await createProperty({
      propertyDTORecord: JSON.stringify(property),
      propertyOwnerId: this.propertyOwnerId,
      base64: base64,
      filename: filename,
      recordId: this.recordId,
  })
  .then((result) => {
      this.ShowToast("Success", result, "success", "dismissable");
      this.handlePropertyLoginSignup();
  })
  .catch((error) => {
      this.ShowToast("Error", "Something went wrong, " + error.body["message"], "error", "dismissable");
  })
  .finally(() => {
      this.clearForm();
      this.showSpinner = false;
  });
}
}