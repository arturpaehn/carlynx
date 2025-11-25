Answers to DealerCenter Integration Questions

1. Can you accept our default feed (attached)?
Yes, we accept your default feed format.

2. What are the required fields in the file? (what cannot be blank)
AccountID or DCID, DealerName, Phone, City, State, StockNumber, VIN, Year, Make, Model, Trim, Odometer, SpecialPrice, Transmission

3. Do they want the file to have Header?
Yes, header row is required.

4. What is your FTP information?
We use REST API instead of FTP.
Endpoint: https://carlynx.us/api/dealercenter/feed/ingest
Authentication: Authorization: Bearer dc_live_gap457yshfvx8mdbwqkcje0lzi3n21u9
Method: POST with CSV data in body

If you specifically need FTP/SFTP, we can implement it in 2-3 business days.

5. Will you accept one file for all dealers?
Yes.

6. If not, will you allow us to drop a file for each dealer via one FTP account and location?
Both approaches work - one file for all dealers OR separate files per dealer.

7. Do you have a filename requirement?
No.

8. If not, we suggest DealerCenter_YYYYMMDD_DCID.csv or .txt
Perfect, that works.

9. File type/Output Type (CSV or TXT)
Both CSV and TXT accepted.

10. Delimitation (comma, tab, pipe)
Comma (,)

11. What is your contact information? (Support Email Address)
support@carlynx.us

12. What is your support contact information?
Email: support@carlynx.us
WhatsApp: +372 555 32171
Location: Europe (EET timezone, UTC+2)

13. What is your update schedule? (1 per day?)
No limit - we support multiple updates per day.

14. We export 3 times a day
Perfect - we support 3x daily updates.

15. What is the Delimitation to be used?
Comma (,)

16. Do they want the Headers to be displayed in the file?
Yes.

Complete Example Header:
AccountID,DCID,DealerName,Phone,Address,City,State,Zip,StockNumber,VIN,Year,Make,Model,Trim,Odometer,SpecialPrice,ExteriorColor,InteriorColor,Transmission,PhotoURLs,VehicleDescription,EquipmentCode,LatestPhotoModifiedDate
