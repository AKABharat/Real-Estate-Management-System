/*
Class Name           : RealEstateManagementController
Description          : controller class for real estate management system serves as server side. 
Created Date         : 08/08/2024
Modification Date    : 04/09/2024    
Developer Name       : BHARAT DOODI   
*/

// https://help.salesforce.com/s/articleView?id=sf.comm_disable_welcome_email.htm&type=5

public without sharing class RealEstateManagementController {
        /*
* @methodname: property_Search_DropDown
* @description: method helps in getting property type and property city
* @param: none
* @return: Map<String,List<String>>
*/
    @AuraEnabled
    public static Map<String,List<String>> property_Search_DropDown(){
        Map<String,List<String>> proDropDownMap = new Map<String,List<String>>();
        List<String> property_Types = new List<String>();
        List<String> Property_City = new List<String>();
        List<Schema.DescribeSobjectResult> results = Schema.describeSObjects(new List<String>{'Property__c'});
        for(Schema.DescribeSobjectResult res : results) {
            for (Schema.PicklistEntry entry : res.fields.getMap().get('Property_Type__c').getDescribe().getPicklistValues()) 
                if (entry.isActive()) 
                    property_Types.add(entry.getLabel());

            for (Schema.PicklistEntry entry : res.fields.getMap().get('Property_City__c').getDescribe().getPicklistValues()) 
                if (entry.isActive()) 
                    Property_City.add(entry.getLabel());
        }
        
        proDropDownMap.put('Property_City', Property_City);
        proDropDownMap.put('Property_Type', property_Types);
        return proDropDownMap;
    }
    
    /*
* @methodname: fetchPropertiesMethod
* @description: method helps in fetching property
* @param: query, recordLimit, offset
* @return: List<Property__c>
*/
    @AuraEnabled
    public static List<Property__c> fetchPropertiesMethod(String query, String recordLimit, String offset){
        try {
            List<Property__c> properties =  query!='' ? database.query('SELECT Name,Area__c, BHK__c,Address__c, Property_Title__c, Property_Type__c, Property_City__c, Price__c, Property_Photos__c FROM Property__c WHERE '+query+' LIMIT '+recordLimit+' OFFSET '+offset) : database.query('SELECT Name,Area__c,Address__c, BHK__c, Property_Title__c, Property_Type__c, Property_City__c, Price__c, Property_Photos__c FROM Property__c LIMIT '+recordLimit+' OFFSET '+offset);
            return properties;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    /*
* @methodname: fetchPropertyDetail
* @description: method helps in fetching property
* @param: propertyId
* @return: List<Property__c> 
*/
    @AuraEnabled
    public static List<Property__c> fetchPropertyDetail(String propertyId){
        try {
            return [SELECT Booking_fee__c, Year_Build__c, Facing_Direction__c, Property_Description__c, Zip_Code__c, Address__c,Area__c,BHK__c,Piped_Gas__c,Parking__c, Floors__c,Price__c,Property_City__c,Property_Photos__c,Property_Title__c,Property_Type__c,Name FROM Property__c WHERE Id = :propertyId];
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

        /*
* @methodname: handleEqMethod
* @description: method handling enquiry
* @param: enquiryName, enquiryEmail, enquiryPhone, enquiryMessage,proId
* @return: void
*/
    @AuraEnabled
    public static void handleEqMethod(String enquiryName, String enquiryEmail, String enquiryPhone, String enquiryMessage,String proId){
        try {
            List<Enquiry__c> EnquiryObj = [SELECT Enquiry_Name__c, Enquiry_Created_Date__c,Property__c, Enquiry_Message__c,Enquiry_Phone__c, Enquiry_Email__c FROM Enquiry__c WHERE Property__c = : proId];
           List<Contact> propertyOwnerList = [SELECT Email  FROM Contact WHERE Id in (SELECT Property_Owner__c from Property__c WHERE Id=:proId)];
            String PropertyOwnerEmailId = propertyOwnerList[0].Email;
            String PropertyOwnerId = propertyOwnerList[0].Id;
            if(EnquiryObj.size() > 0){
                EnquiryObj[0].Enquiry_Name__c = enquiryName;
                EnquiryObj[0].Enquiry_Message__c = enquiryMessage;
                EnquiryObj[0].Property__c = proId;
                EnquiryObj[0].Property_Owner__c = PropertyOwnerId;
                EnquiryObj[0].Property_Owner_Email__c = PropertyOwnerEmailId;
                update EnquiryObj[0];
            }

            else{

                Enquiry__c newEnquiry = new Enquiry__c();
                newEnquiry.Enquiry_Name__c = enquiryName;
                newEnquiry.Enquiry_Email__c = enquiryEmail;
                newEnquiry.Property_Owner_Email__c = PropertyOwnerEmailId;
                newEnquiry.Enquiry_Phone__c = enquiryPhone;
                newEnquiry.Enquiry_Message__c = enquiryMessage;
                newEnquiry.Property_Owner__c = PropertyOwnerId;
                newEnquiry.Enquiry_Created_Date__c = System.today();
                newEnquiry.Property__c = proId;
                insert newEnquiry;
            }

        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }



    @AuraEnabled
    public static boolean userExistenceHandle(String email){
        try {
            List<Contact> existingContacts = [SELECT Id FROM Contact WHERE Email = :email LIMIT 1];
            return existingContacts.isEmpty()? false:true;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    /*
* @methodname: registerUser
* @description: method helps user register
* @param: firstName, lastName, email,  userType, mobileNumber
* @return: String
*/
    @AuraEnabled
    public static String registerUser(String firstName, String lastName, String email, String mobileNumber, String password ) {
        try {
            Account getAccount = [Select Id from Account Where Name='Burlington Textiles Corp of America' LIMIT 1];
            List<Contact> existingContacts = [SELECT Id FROM Contact WHERE Email = :email LIMIT 1];
            if(!existingContacts.isEmpty()){
                return 'User exists';
            }
            // Create a new Contact
            Contact newContact = new Contact(
                FirstName = firstName,
                LastName = lastName,
                Email = email,
                MobilePhone = mobileNumber, 
                AccountId = getAccount.Id
              //  User_Type__c = userType 
            );
            insert newContact;

            // Determine Profile ID based on user type
            Id profileId;
            /*if (userType == 'Buyer') {
                profileId = [SELECT Id FROM Profile WHERE Name = 'Buyer Real Estate' LIMIT 1].Id;
            } else if (userType == 'Seller') {
                profileId = [SELECT Id FROM Profile WHERE Name = 'Seller Real Estate' LIMIT 1].Id;
            } else {
                return 'Error: Invalid user type';
            }
            */
            profileId = [SELECT Id FROM Profile WHERE Name = 'Real Estate Users' LIMIT 1].Id;
              // Generate a random username
              
        String randomUsername = generateRandomEmailUsername(firstName, lastName);
        // Ensure the random username is unique
        while([SELECT COUNT() FROM User WHERE Username = :randomUsername] > 0) {
            randomUsername = generateRandomEmailUsername(firstName, lastName);
        }

            // Create a new User
            User newUser = new User(
                FirstName = firstName,
                LastName = lastName,
                Email = email,
                Username = randomUsername, // Username typically matches email in Community
                CommunityNickname = firstName + '.' + lastName,
                ProfileId = profileId, // Assigning the profile based on user type
                ContactId = newContact.Id,
                Alias = firstName.substring(0, 1) + lastName.substring(0, 1),
                TimeZoneSidKey = 'Asia/Kolkata', // Adjust based on your region
                LocaleSidKey = 'en_US',
                EmailEncodingKey = 'UTF-8',
                LanguageLocaleKey = 'en_US',
                IsActive = true
            );
              // Disable the auto-generated email
          /*  Database.DMLOptions dmlOptions = new Database.DMLOptions();
            dmlOptions.EmailHeader.triggerUserEmail = false;
            newUser.setOptions(dmlOptions);
*/
            insert newUser;

            // Set the user's password
           System.setPassword(newUser.Id, password);
            // Send the welcome email with login details
        sendWelcomeEmail(firstName, lastName, email, randomUsername);

            return 'User registered successfully';
        } catch (Exception e) {
            return 'Error: ' + e.getMessage();
        }
    }

    /*
* @methodname: loginUser
* @description: method helps user login
* @param: email, password,directUrl
* @return: String
*/
    @AuraEnabled
    public static String loginUser(String email, String password,String directUrl) {
        try {
            // Query for the user
            User loginUser = [SELECT Id, Email, IsActive FROM User WHERE UserName = :email LIMIT 1];
            if (loginUser == null || !loginUser.IsActive) {
                return 'Error: Invalid login credentials or inactive user';
            }
            ApexPages.PageReference lgn = Site.login(email,password,directUrl);
            return lgn.getUrl();
            // Here Salesforce would handle password authentication. Assuming successful login:
           
        } catch (Exception e) {
          //  return 'Login failed: ' + e.getMessage();
          throw new AuraHandledException(e.getMessage());
        }
    }

    /*
* @methodname: registerUser
* @description: method helps user register
* @param: firstName, lastName, email,  userType, mobileNumber
* @return: String
*/

    private static String generateRandomEmailUsername(String firstName, String lastName) {
        String randomString = '';
        String chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        Integer length = 8; // Length of the random part of the username
    
        for (Integer i = 0; i < length; i++) {
            Integer index = Math.mod(Math.abs(Crypto.getRandomInteger()), chars.length());
            randomString += chars.substring(index, index + 1);
        }
    
        // Generate an email-like username
        return firstName + '.' + lastName + '.' + randomString + '@example.com';
    }




    // Helper method to send a welcome email
private static void sendWelcomeEmail(String firstName, String lastName, String email, String username) {
    Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
    String[] toAddresses = new String[] { email };

    mail.setToAddresses(toAddresses);
    mail.setSubject('Welcome to Real Estate Community');
    mail.setPlainTextBody(
        'Hello ' + firstName + ' ' + lastName + ',\n\n' +
        'Thank you for registering ' + ' in our Real Estate Community.\n\n' +
        'Here are your login details:\n' +
        'Username: ' + username + '\n' +
       // 'Temporary Password : ' + 'welcome@123' + '\n\n' +
        'Please use this username and password you set while regisration to the site.\n\n' +
        'If you need to get to the community dashboard again, please click on the link at the end of the email.\n\n' +
        'If you have any questions please contact us at the email listed in our Contact Us page.\n\n' +
        'Thank you!\n\n' +
        'Please keep this information safe.\n' +
        'Best regards,\n' +
        'Real Estate Community Team'
    );

    // Send the email
    Messaging.sendEmail(new Messaging.SingleEmailMessage[] { mail });
}




@AuraEnabled
public static List<Contact> getDetailsMethod(){
    try {
        String ownerId = [SELECT ContactId FROM User WHERE Id =: UserInfo.getUserId() AND isActive = true][0].ContactId;
        List<Contact> ownerDetail = [SELECT Name,Email, User_Type__c, MobilePhone ,Total_Properties__c, Total_Enquiry__c FROM Contact WHERE Id =: ownerId];
        return ownerDetail;
    } catch (Exception e) {
        throw new AuraHandledException(e.getMessage());
    }
}


@AuraEnabled
public static List<Property__c> showPropertiesHandleMethod(String proOwnerId){
    try {
       List<Property__c> proList =  [SELECT Name,Area__c,Address__c, BHK__c, Property_Title__c, Property_Type__c, Property_City__c, Price__c, Property_Photos__c FROM Property__c WHERE Property_Owner__c =: proOwnerId];
        return proList;
    } catch (Exception e) {
        throw new AuraHandledException(e.getMessage());
    }
}
@AuraEnabled
public static List<Enquiry__c> showInquiriesHandleMethod(String proOwnerId){
    try {
        List<Enquiry__c> enqList = [SELECT Name,Enquiry_Message__c, Enquiry_Email__c,Enquiry_Phone__c,Enquiry_Created_Date__c, Enquiry_Name__c from Enquiry__c WHERE Property__c IN (SELECT Id FROM Property__c WHERE Property_Owner__c =:proOwnerId )];
        return enqList;
    } catch (Exception e) {
        throw new AuraHandledException(e.getMessage());
    }
}
@AuraEnabled
public static void deletePropertyMethod(String propertyId){
    try {
        List<Property__c> proList = [SELECT Id FROM Property__c WHERE Id =: propertyId];
        delete proList;
    } catch (Exception e) {
        throw new AuraHandledException(e.getMessage());
    }
}

@AuraEnabled
public static List<Enquiry__c> showEnquiryMethod(String enquiryId){
    try {
        List<Enquiry__c> enqList = [SELECT Name,Enquiry_Message__c, Enquiry_Email__c,Enquiry_Phone__c,Enquiry_Created_Date__c, Enquiry_Name__c from Enquiry__c WHERE Id =: enquiryId];
        return enqList;
    } catch (Exception e) {
        throw new AuraHandledException(e.getMessage());
    }
}

@AuraEnabled
public static void deleteEnquiryMethod(String enquiryId){
    try {
        List<Enquiry__c> enqList = [SELECT Id FROM Enquiry__c WHERE Id =: enquiryId];
        delete enqList;
    } catch (Exception e) {
        throw new AuraHandledException(e.getMessage());
    }
}


@AuraEnabled
public static String createProperty(String propertyDTORecord, String propertyOwnerId, String base64, String filename, String recordId) {
    try {

        PropertyDTO obj = (PropertyDTO) JSON.deserialize(propertyDTORecord, PropertyDTO.class);
        Property__c newProperty = new Property__c();
        newProperty.Property_Title__c = obj.Title;
        newProperty.Property_Type__c = obj.propertyType;
        newProperty.Property_City__c = obj.propertyCity;
        newProperty.BHK__c = obj.BHK;
        newProperty.Area__c = obj.Area;
        newProperty.Address__c = obj.Address;
        newProperty.Floors__c = obj.Floor;
        newProperty.Parking__c = obj.Parking == 'true'?'Yes' : 'No';
        newProperty.Piped_Gas__c = obj.PipedGas == 'true'?'Yes' : 'No';
        newProperty.Zip_Code__c = obj.ZipCode;
        newProperty.Facing_Direction__c = obj.FacingDirection;
        newProperty.Year_Build__c = obj.YearBuilt;
        newProperty.Price__c = obj.Price;
        newProperty.Booking_Fee__c = obj.BookingFee;
        newProperty.Property_Description__c = obj.Description;

        newProperty.Property_Owner__c = propertyOwnerId;

        String imageLink = '<p><img src="data:image/jpeg;base64,' + base64 + '" alt="rtaImage.jpeg"></img></p>';
        newProperty.Property_Photos__c = imageLink; 
        insert newProperty;

        return 'Success: Property created successfully.';
    } catch (Exception e) {
        throw new AuraHandledException(e.getMessage());
    }
}


@AuraEnabled
public static List<Enquiry__c> handleProAndEnqOfOwner(String ProBuyerEmailId){
    try {
        List<Enquiry__c> enqProList= [SELECT Name,Enquiry_Message__c, Enquiry_Email__c,Enquiry_Phone__c,Enquiry_Created_Date__c ,Enquiry_Name__c, Property__r.Name,Property__r.Area__c,Property__r.Address__c, Property__r.BHK__c, Property__r.Property_Title__c, Property__r.Property_Type__c, Property__r.Property_City__c, Property__r.Price__c, Property__r.Property_Photos__c  from Enquiry__c WHERE Enquiry_Email__c =:ProBuyerEmailId ];
        return enqProList;
    } catch (Exception e) {
        throw new AuraHandledException(e.getMessage());
    }
}



@AuraEnabled
public static void verifyUser(String signupEmailId, String otpValue){
    try {
        Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
        
        String[] toAddresses = new String[] { signupEmailId };

        mail.setToAddresses(toAddresses);
        mail.setSubject('Your OTP for Verification | Bharat Real Estate');
        mail.setPlainTextBody(
            'Hello,\n\n' +
            'Thank you for registering in our Real Estate Community.\n\n' +
            'Your One-Time Password (OTP) for verification is: ' + otpValue + '\n\n' +
            'Please use this OTP to verify your account on our website.\n\n' +
            'If you did not request this, please ignore this email.\n\n' +
            'If you have any questions, feel free to contact us at the email listed on our Contact Us page.\n\n' +
            'Thank you!\n\n' +
            'Best regards,\n' +
            'Real Estate Community Team'
    );
    
         Messaging.sendEmail(new Messaging.SingleEmailMessage[] { mail });
    } catch (Exception e) {
        throw new AuraHandledException(e.getMessage());
    }
}

public class PropertyDTO {
    @AuraEnabled public String Title;
    @AuraEnabled public String propertyType;
    @AuraEnabled public String propertyCity;
    @AuraEnabled public Integer BHK;
    @AuraEnabled public Integer Area;
    @AuraEnabled public String Images;
    @AuraEnabled public String Address;
    @AuraEnabled public Integer Floor;
    @AuraEnabled public String Parking;
    @AuraEnabled public String PipedGas;
    @AuraEnabled public Integer ZipCode;
    @AuraEnabled public String FacingDirection;
    @AuraEnabled public Integer YearBuilt;
    @AuraEnabled public Decimal Price;
    @AuraEnabled public Decimal BookingFee;
    @AuraEnabled public String Description;
}





@AuraEnabled
public static String getResponse(String userMessage) {
    String apiKey = 'sk-y2gNMrMyiZ_vsOq3FLgRxafGWDOgp_PkPb5qCVEOnoT3BlbkFJJzXt1JP0IZ3IcD8PXd13cwagGUITTQhEApRfoBk8EA';  // Replace with your actual OpenAI API key
    String endpoint = 'https://api.openai.com/v1/completions';
    
    HttpRequest req = new HttpRequest();
    req.setEndpoint(endpoint);
    req.setMethod('POST');
    req.setHeader('Content-Type', 'application/json');
    req.setHeader('Authorization', 'Bearer ' + apiKey);
    
    // Construct the request body
    String body = JSON.serialize(new Map<String, Object>{
        'model' => 'text-davinci-003',  // Choose the appropriate model
        'prompt' => userMessage,
        'max_tokens' => 150
    });
    req.setBody(body);
    
    Http http = new Http();
    HttpResponse res = http.send(req);
    
    // Parse the response
    if (res.getStatusCode() == 200) {
        Map<String, Object> result = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
        List<Map<String, Object>> choices = (List<Map<String, Object>>) result.get('choices');
        if (!choices.isEmpty()) {
            return (String) choices.get(0).get('text');
        } else {
            return 'No response from the model.';
        }
    } else {
        return 'Error: ' + res.getStatus() + ' - ' + res.getBody();
    }
}

}