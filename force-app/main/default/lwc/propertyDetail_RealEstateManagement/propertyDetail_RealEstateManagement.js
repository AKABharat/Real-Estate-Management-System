import { LightningElement, track, api, wire } from "lwc";

import jsPDF from "@salesforce/resourceUrl/jsPDF";
import autoTable from "@salesforce/resourceUrl/jspdf_autotable";
import { loadScript } from "lightning/platformResourceLoader";

import { CurrentPageReference } from "lightning/navigation";
import fetchPropertyDetail from "@salesforce/apex/RealEstateManagementController.fetchPropertyDetail";
import handleEqMethod from "@salesforce/apex/RealEstateManagementController.handleEqMethod";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
export default class PropertyDetail_RealEstateManagement extends LightningElement {
  @track property = {};
  @api propertyId;
  @track amount = 0;
  @track downPayment = 0;
  @track InterestRate = 0;
  @track tenure = 0;
  @track emi = 0;
  @track totalInterest = 0;
  @track totalAmount = 0;
  @track calculateMortgagedFlag = false;
  @track enquiryMessage = "";
  @track enquiryPhone = "";
  @track enquiryName = "";
  @track enquiryEmail = "";
  @track showSpinner = false;
  @track imageUrls;
  @track proId;
  @track mapMarkers = [];
  @api address;
  validRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

  jsPDFInitialized = false;

  renderedCallback() {
    if (this.jsPDFInitialized) {
      return;
    }
    loadScript(this, jsPDF)
      .then(() => {
        return loadScript(this, autoTable); // Load the autoTable plugin after jsPDF
      })
      .then(() => {
        this.jsPDFInitialized = true;
      })
      .catch((error) => {
        this.showErrorToast("Error loading jsPDF or autoTable");
      });
  }

  handleGeneratePDF() {
    if (!this.jsPDFInitialized) {
      this.showErrorToast("jsPDF not initialized");
      this.showSpinner = false;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // pdf background color
    //doc.setFillColor(211, 238, 238);

    // Add Title
    doc.setFontSize(10);
    doc.text("Bharat Real Estate", 20, 10);

    doc.setFontSize(20);
    doc.text(`${this.property.Title}'s Brochure`, 20, 25);
    // Define the data for the table
    const data = [
      ["Title", this.property.Title],
      ["Type", this.property.type],
      ["City", this.property.city],
      ["BHK", this.property.BHK],
      ["Area", `${this.property.area} sq.ft.`],
      ["Address", this.property.address],
      ["Floor", this.property.floor],
      ["Parking", this.property.parking],
      ["Piped Gas", this.property.pipedGas],
      ["Zip Code", this.property.zipCode],
      ["Facing Direction", this.property.facingDirection],
      ["Year Built", `${this.property.yearBuild}`],
      ["Price", `Rs.${this.property.price}`],
      ["Booking Fee", `Rs.${this.property.bookingfee}`],
      ["Description", this.property.propertyDescription],
    ];

    // Generate the table using autoTable plugin
    doc.autoTable({
      startY: 30, // starting Y position after the title
      head: [["Detail", "Value"]],
      body: data,
    });

    // Loop through each image and add it to a new page
    for (let i = 0; i < this.imageUrls.length; i++) {
      doc.addPage(); // Add a new page for each image

      // Add image title
      doc.setFontSize(16);
      doc.text(`Property Image ${i + 1}`, 20, 20);

      // Add image to occupy the entire page
      const img = new Image();
      img.src = this.imageUrls[i];

      // Calculate the aspect ratio to fill the page appropriately
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 40; // Leave some margin
      const imgHeight = (img.height / img.width) * imgWidth;

      // Center the image on the page
      const xOffset = 20; // 20 units margin on the left
      const yOffset = (pageHeight - imgHeight) / 2;

      doc.addImage(img, "JPEG", xOffset, yOffset, imgWidth, imgHeight);
    }
    // Save the PDF
    doc.save("propertyDetails.pdf");
  }

  connectedCallback() {
    this.getPropertyDetails();
  }

  @wire(CurrentPageReference)
  setCurrentPageReference(pageRef) {
    if (pageRef.state.propertyId) {
      this.propertyId = pageRef.state.propertyId;
      this.getPropertyDetails();
    }
  }

  getPropertyDetails() {
    this.showSpinner = true;
    fetchPropertyDetail({ propertyId: this.propertyId })
      .then((result) => {
        var pro = result[0];

        // Parse the HTML content
        const parser = new DOMParser();
        const doc = parser.parseFromString(pro.Property_Photos__c, "text/html");

        // Extract all image URLs
        const imgElements = doc.querySelectorAll("img");
        this.imageUrls = Array.from(imgElements).map((img) => img.src);
        this.proId = pro.Id;
        this.property = {
          Title: pro.Property_Title__c,
          Name: pro.Name,
          type: pro.Property_Type__c,
          city: pro.Property_City__c,
          price: pro.Price__c,
          images: this.imageUrls, // Updated to handle multiple images
          id: pro.Id,
          BHK: pro.BHK__c,
          area: pro.Area__c,
          address: pro.Address__c,
          floor: pro.Floors__c,
          parking: pro.Parking__c,
          pipedGas: pro.Piped_Gas__c,
          zipCode: pro.Zip_Code__c,
          propertyDescription: pro.Property_Description__c,
          facingDirection: pro.Facing_Direction__c,
          yearBuild: pro.Year_Build__c,
          bookingfee: pro.Booking_fee__c,
        };

        this.mapMarkers = [
          {
            location: {
              Street: this.property.address,
              City: this.property.city,
            },
            value: "location",
            title: "The Property Location",
            description:
              "The Landmark is considered on location as per information, please contact Property Owner for more information.", //escape the apostrophe in the string using &#39;
            icon: "standard:account",
          },
        ];
        this.showSpinner = false;
      })
      .catch((error) => {
        this.ShowToast(
          "Error",
          "We caught an error while fetching property detail",
          "error",
          "dismissable"
        );
      });
  }

  calculateMortgaged() {
    this.showSpinner = true;
    if (this.amount - this.downPayment < 0) {
      this.ShowToast(
        "Warning",
        "Down Payment should be less than Amount",
        "warning",
        "dismissable"
      );
      this.showSpinner = false;
      return;
    }
    const principal = this.amount - this.downPayment;
    const rate = this.interestRate / 100 / 12;
    const numberOfPayments = this.tenure;
    if (rate === 0) {
      this.emi = principal / numberOfPayments;
    } else {
      this.emi =
        (principal * rate) / (1 - Math.pow(1 + rate, -numberOfPayments));
    }

    this.totalAmount = this.emi * numberOfPayments;
    this.totalInterest = this.totalAmount - principal;
    this.emi = this.emi == NaN ? 0 : this.emi;
    this.totalAmount = this.totalAmount == NaN ? 0 : this.totalAmount;
    this.totalInterest = this.totalInterest == NaN ? 0 : this.totalInterest;

    if (principal == 0 && principal == 0 && numberOfPayments == 0) {
      this.emi = 0;
      this.totalInterest = 0;
      this.totalAmount = 0;
    }

    this.calculateMortgagedFlag = true;
    this.showSpinner = false;
  }

  resetFields() {
    this.showSpinner = true;
    this.amount = 0;
    this.downPayment = 0;
    this.interestRate = 0;
    this.tenure = 0;

    this.emi = 0;
    this.totalInterest = 0;
    this.totalAmount = 0;
    this.calculateMortgagedFlag = false;
    this.showSpinner = false;
  }

  loanDataHandle(event) {
    this.showSpinner = true;
    var targetName = event.target.name;
    var targetValue = parseFloat(event.target.value);
    if (targetName == "amount") this.amount = targetValue;
    else if (targetName == "downPayment") this.downPayment = targetValue;
    else if (targetName == "InterestRate") this.InterestRate = targetValue;
    else if (targetName == "tenure") this.tenure = targetValue;
    this.showSpinner = false;
  }

  handleEqInputChange(event) {
    var targetName = event.target.name;
    var targetValue = event.target.value;
    if (targetName == "enquiryName") this.enquiryName = targetValue;
    else if (targetName == "enquiryEmail") this.enquiryEmail = targetValue;
    else if (targetName == "enquiryPhone") this.enquiryPhone = targetValue;
    else if (targetName == "enquiryMessage") this.enquiryMessage = targetValue;
  }
  /*
  isAlphanumeric(str) {
    return /^[a-zA-Z0-9]+$/.test(str);
  }
 */
  isAphabatic(str) {
    return /[^a-zA-Z]/.test(str);
  }

  isNumeric(str) {
    return /[0-9]/.test(str);
  }

  validateEmail(email) {
    var validation =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
        email
      );
    return validation;
  }

  handleEqSubmit() {
    this.showSpinner = true;
    if (
      this.enquiryName == "" ||
      this.enquiryEmail == "" ||
      this.enquiryPhone == "" ||
      this.enquiryPhone == 0 ||
      this.enquiryMessage == ""
    ) {
      this.ShowToast(
        "Warning",
        "Please fill all the enteries.",
        "warning",
        "dismissible"
      );
      this.showSpinner = false;
      return;
    } else if (this.isAphabatic(this.enquiryName)) {
      this.ShowToast(
        "Warning",
        "Wrong Name, Please enter a valid Name",
        "warning",
        "dismissible"
      );
      this.showSpinner = false;
      return;
    } else if (!this.isNumeric(this.enquiryPhone)) {
    /*
    else if(this.validateEmail(this.enquiryEmail)){
      this.ShowToast(
        "📩❌",
        "Wrong Email-Id, Please enter valid Email-Id",
        "warning",
        "dismissible"
      );
      this.showSpinner = false;
      return;
    }
*/
      this.ShowToast(
        "📞❌",
        "Wrong Phone Number, Please enter valid Email-ID",
        "warning",
        "dismissible"
      );
      this.showSpinner = false;
      return;
    }

    handleEqMethod({
      enquiryName: this.enquiryName,
      enquiryEmail: this.enquiryEmail,
      enquiryPhone: this.enquiryPhone,
      enquiryMessage: this.enquiryMessage,
      proId: this.proId,
    })
      .then((result) => {
        this.ShowToast(
          "Success",
          "Thank you for your enquiry, We will get in touch with you soon." +
            error.body["message"],
          "success",
          "dismissible"
        );
      })
      .catch((error) => {
        this.ShowToast(
          "Error",
          "We caught an error! Sorry for your inconvenience, " +
            error.body["message"],
          "error",
          "dismissable"
        );
      })
      .finally(() => {
        this.enquiryName = "";
        this.enquiryEmail = "";
        this.enquiryMessage = "";
        this.enquiryPhone = "";
        this.showSpinner = false;
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



