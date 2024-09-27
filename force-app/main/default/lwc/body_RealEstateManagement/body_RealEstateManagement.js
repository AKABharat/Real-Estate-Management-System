/*
Class Name           : allProperties_RealEstateManagementSystem
Description          : helps in handling client side  allProperties functionality 
Created Date         : 06/06/2024
Modification Date    : 11/06/2024    
Developer Name       : BHARAT DOODI   
*/
import { LightningElement, track } from "lwc";
import heroPage from "@salesforce/resourceUrl/heroPage";
import heroPage_1 from "@salesforce/resourceUrl/heroPage_1";
import personStaticImage from "@salesforce/resourceUrl/PersonImage";
import heroPage_2 from "@salesforce/resourceUrl/heroPage_2";
import getResponse from "@salesforce/apex/RealEstateManagementController.getResponse";
import heroPage_3 from "@salesforce/resourceUrl/heroPage_3";
import heroPage_4 from "@salesforce/resourceUrl/heroPage_4";
import property_Search_DropDown from "@salesforce/apex/RealEstateManagementController.property_Search_DropDown";
import fetchPropertiesMethod from "@salesforce/apex/RealEstateManagementController.fetchPropertiesMethod";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { NavigationMixin } from "lightning/navigation";
// import { NavigationMixin } from 'lightning/navigation'; //lightning/navigation is a library
//NavigationMixin  is a module name
// note : type and attribute are compulsory
export default class Body_RealEstateManagement extends NavigationMixin(
  LightningElement
) {
  personStaticImage = personStaticImage // person static
  // images imported from static resource in salesforce
  heroPage = heroPage;
  hero0 = heroPage_1;
  hero1 = heroPage_2;
  hero2 = heroPage_3;
  hero3 = heroPage_4;

  @track propertyTypeValue = "";
  @track propertyTypePrice = "";
  @track propertyTypeCity = "";
  @track properties = []; // store all property in a list
  @track query; // helps in forming soql query
  @track recordLimit = 4; // initial records to show limit
  @track offset=0;
  @track showSpinner = false;
  // below variables helps as form query at client side only
  price = "Price__c";
  type = "Property_Type__c";
  city = "Property_City__c";
  @track showProperties = false;
  @track Property_Type_Options = [];
  @track Property_City_Options = [];
  @track showMoreBtnFlag=false;
  @track Property_Price_Options = [
    {
      label: "None",
      value: "",
    },
    {
      label: "10 lac - 30 lac",
      value: this.price + " >= 1000000 AND " + this.price + " <= 3000000",
    },
    {
      label: "30 lac - 60 lac",
      value: this.price + " >= 3000000 AND " + this.price + " <= 6000000",
    },
    {
      label: "60 lac - above",
      value: this.price + " >= 6000000 ",
    },
  ];

  PropertySearchChange(event) {
    const eventName = event.target.name;
    if (eventName == "propertyType")
      this.propertyTypeValue = event.target.value;
    else if (eventName == "propertyPrice")
      this.propertyTypePrice = event.target.value;
    else if (eventName == "propertyCity")
      this.propertyTypeCity = event.target.value;
  }
  // connectedCallBack function fires when a component is increated in the DOM
  connectedCallback() {
    
    property_Search_DropDown()
      .then((result) => {
        var valuesList = [];
        valuesList.push({
          label: "None",
          value: "",
        });
        for (var item of result["Property_Type"])
          valuesList.push({
            label: item,
            value: this.type + " = '" + item + "'",
          });
        this.Property_Type_Options = valuesList;
        valuesList = [];
        valuesList.push({
          label: "None",
          value: "",
        });
        for (var item of result["Property_City"])
          valuesList.push({
            label: item,
            value: this.city + " = '" + item + "'",
          });
        this.Property_City_Options = valuesList;
        
      })
      .catch((error) => {
        this.ShowToast(
          "Error",
          error.body["message"],
          "error",
          "dismissable"
        );
      });
  }

  showRecordUI(result){
    this.showMoreBtnFlag=false;
    for (let pro of result) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(
        pro.Property_Photos__c,
        "text/html"
      );
      const imgElement = doc.querySelector("img");
      const imageUrl = imgElement ? imgElement.src : "";
      this.properties.push({
        Title: pro.Property_Title__c,
        Name: pro.Name,
        type: pro.Property_Type__c,
        city: pro.Property_City__c,
        price: pro.Price__c,
        image: imageUrl,
        id: pro.Id,
        BHK: pro.BHK__c,
        Size: pro.Area__c,
      });
    }
    if(this.properties.length>4){
      this.showMoreBtnFlag=true;
    }
  }

  fetchPropertiesSearchBtn(){
    this.properties = [];
    this.recordLimit=4;
    this.offset=0;
    console.log(this.propertyTypeValue == "" &&
      this.propertyTypePrice == "" &&
      this.propertyTypeCity == "");
   if (
      this.propertyTypeValue == "" &&
      this.propertyTypePrice == "" &&
      this.propertyTypeCity == ""
    ) {
      this.ShowToast(
        "Warning",
        "Please select at least 'City' for seaching property",
        "warning",
        "dismissable"
      );
      this.showSpinner = false;
      return;
    }
      var query = "";
      query = this.propertyTypeCity != "" ? this.propertyTypeCity : query;
      query =
        this.propertyTypeValue != ""
          ? query != ""
            ? (query += " AND " + this.propertyTypeValue)
            : (query += " " + this.propertyTypeValue)
          : query;
      query =
        this.propertyTypePrice != ""
          ? query != ""
            ? (query += " AND " + this.propertyTypePrice)
            : (query += " " + this.propertyTypePrice)
          : query;
  
      this.query = query;
      this.fetchProperties();  
  }

  showMoreRecordBtn(){
    this.offset = this.offset + this.recordLimit;
    this.recordLimit*=2;;
    this.fetchProperties();
  }
  
  fetchProperties() {
    this.showSpinner = true;
    fetchPropertiesMethod({ query: this.query, recordLimit : this.recordLimit, offset : this.offset})
      .then((result) => {
        this.showRecordUI(result);
      })
      .catch((error) => {
        this.ShowToast(
          "Error",
          "We caught an error while fetching properties, "+error.body['message'],
          "error",
          "dismissable"
        );
      })
      .finally(() => {
        this.showProperties = true;
        this.showSpinner = false;
      });
  }

  getPropertyDetail(event) {
    var propertyId = event.currentTarget.dataset.proid;
    this[NavigationMixin.Navigate]({
      type: "comm__namedPage",
      attributes: {
        name: "propertydetail__c",
      },
      state: {
        propertyId: propertyId,
      },
    });
  }

  getAllProperyPage(){
            
    this[NavigationMixin.Navigate]({
        type: 'comm__namedPage',
        attributes: {
            name: 'AllProperties__c',
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


//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
      
//sk-y2gNMrMyiZ_vsOq3FLgRxafGWDOgp_PkPb5qCVEOnoT3BlbkFJJzXt1JP0IZ3IcD8PXd13cwagGUITTQhEApRfoBk8EA



@track userMessage = '';
  @track chatMessages = [];

  handleMessageChange(event) {
    this.userMessage = event.target.value;
  }

  handleSend() {
    getResponse({ userMessage: this.userMessage })
      .then(result => {
        this.chatMessages = [...this.chatMessages, { id: this.chatMessages.length + 1, text: result }];
        this.userMessage = '';
      })
      .catch(error => {
        console.error('Error sending message: ', error);
      });
  }


  
}