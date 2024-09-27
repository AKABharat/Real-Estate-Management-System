/*
Class Name           : allProperties_RealEstateManagementSystem
Description          : helps in structure allProperties 
Created Date         : 06/06/2024
Modification Date    : 11/06/2024    
Developer Name       : BHARAT DOODI   
*/
import { LightningElement,track } from 'lwc';
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import fetchPropertiesMethod from "@salesforce/apex/RealEstateManagementController.fetchPropertiesMethod";
import {NavigationMixin} from 'lightning/navigation';
export default class AllProperties_RealEstateManagementSystem extends NavigationMixin(LightningElement) {
  @track properties = [];  // contains all properties fetched from serverside
  @track showSpinner=false; // showing spinner
  @track mapMarkers = []; // helps in showing google map on ui 
  @track recordLimit = 4; // initial records to show limit
  @track offset=0;  // helps in getting next records from dataset with offset 
  listView = 'visible';  // property value in lighting map helps in showing data inforation on map
  @track mapMarkersFlag = false; // helps in showing map
 
 // metod executed on creation of lwc component 
  connectedCallback(){
    this.fetchProperties();
  }

  // common method helps in showing records on ui
    showRecordUI(result){
      this.mapMarkersFlag=false;
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

        this.mapMarkers.push(
          {
            location: {
              Street: pro.Address__c,
              City: pro.Property_City__c,
            },
            value: "location",
            title: pro.Property_Title__c,
            description:
              "The Landmark is considered on location as per information, please contact Property Owner for more information.", //escape the apostrophe in the string using &#39;
            icon: "standard:account",
          },
          
        );
      }
      this.mapMarkersFlag=true;
    }
  

    // method helps in showing record butn functionality
    showMoreRecordBtn(){
      this.offset = this.offset + this.recordLimit;
      this.recordLimit*=2;;
      this.fetchProperties();
    }
    

    // method helps in getting all proeprty form server 
    fetchProperties() {
      this.showSpinner = true;

      fetchPropertiesMethod({ query: '', recordLimit : this.recordLimit, offset : this.offset})
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
      .finally(()=>{
        this.showSpinner=false;
      });
    }
// method helps in getting property details
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