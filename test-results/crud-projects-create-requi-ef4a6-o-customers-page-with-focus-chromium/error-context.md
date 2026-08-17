# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: crud.spec.ts >> projects: create requires a customer; customer link navigates to customers page with focus
- Location: e2e-tests\crud.spec.ts:130:1

# Error details

```
Test timeout of 45000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]: A
      - generic [ref=e7]:
        - generic [ref=e8]: ARTELIER
        - generic [ref=e9]: QUALITY SYSTEM
    - generic [ref=e10]:
      - text: WORKSPACE
      - button "Quotation Management" [ref=e11] [cursor=pointer]
    - navigation [ref=e15]:
      - button "Dashboard" [ref=e16] [cursor=pointer]
      - button "Branches" [ref=e23] [cursor=pointer]
      - button "Customers" [ref=e29] [cursor=pointer]
      - button "Projects" [ref=e36] [cursor=pointer]
      - button "Products" [ref=e42] [cursor=pointer]
      - button "Quotations 6" [ref=e45] [cursor=pointer]:
        - generic [ref=e49]: Quotations
        - emphasis [ref=e50]: "6"
      - button "Inspections" [ref=e51] [cursor=pointer]
      - button "Documents" [ref=e57] [cursor=pointer]
      - button "Follow-ups" [ref=e62] [cursor=pointer]
      - button "Reports" [ref=e66] [cursor=pointer]
      - button "Users" [ref=e70] [cursor=pointer]
      - button "Roles" [ref=e77] [cursor=pointer]
      - button "Settings" [ref=e82] [cursor=pointer]
    - generic [ref=e87]:
      - generic [ref=e92]:
        - generic [ref=e93]: Support centre
        - generic [ref=e94]: QMS help & guidance
      - button "Sign out" [ref=e95] [cursor=pointer]
  - main [ref=e99]:
    - generic [ref=e100]:
      - generic [ref=e101]:
        - generic [ref=e102]: QMS
        - generic [ref=e105]: Projects
      - generic [ref=e106]:
        - button [ref=e107] [cursor=pointer]
        - generic [ref=e112]:
          - generic [ref=e113]: SA
          - generic [ref=e114]:
            - generic [ref=e115]: Super Admin
            - generic [ref=e116]: Super Admin
    - generic [ref=e117]:
      - generic [ref=e119]:
        - text: QUALITY MANAGEMENT SYSTEM
        - heading "Projects" [level=1] [ref=e120]
        - paragraph [ref=e121]: Capture project context, stages and separate site and billing addresses.
      - generic [ref=e122]:
        - generic [ref=e123]:
          - generic [ref=e124]:
            - heading "Projects" [level=2] [ref=e125]
            - paragraph [ref=e126]: Project details with surface / area breakdown and site photos to capture.
          - button "New project" [ref=e127] [cursor=pointer]
        - generic [ref=e129]:
          - textbox "Search projects…" [ref=e134]
          - generic [ref=e135]: 5 of 5
        - table [ref=e137]:
          - rowgroup [ref=e138]:
            - row [ref=e139]:
              - columnheader "Project" [ref=e140]
              - columnheader "Customer" [ref=e141]
              - columnheader "Type" [ref=e142]
              - columnheader "Stage" [ref=e143]
              - columnheader "Status" [ref=e144]
              - columnheader "Expected completion" [ref=e145]
              - columnheader "Area (sq.ft.)" [ref=e146]
              - columnheader "Photos" [ref=e147]
              - columnheader [ref=e148]
          - rowgroup [ref=e149]:
            - row [ref=e150]:
              - cell "Corporate Office" [ref=e151]
              - cell "Rajesh Patel" [ref=e156]
              - cell "Commercial" [ref=e160]
              - cell "Execution" [ref=e161]
              - cell "Active" [ref=e162]
              - cell "15 Oct 2026" [ref=e164]
              - cell "2,350" [ref=e165]
              - cell "—" [ref=e166]
              - cell [ref=e167]:
                - button "View" [ref=e168] [cursor=pointer]
                - button "Edit" [ref=e172] [cursor=pointer]
                - button "Delete" [ref=e176] [cursor=pointer]
            - row [ref=e180]:
              - cell "Lakeview Villa" [ref=e181]
              - cell "Priya Sharma" [ref=e186]
              - cell "Residential" [ref=e190]
              - cell "Design" [ref=e191]
              - cell "Active" [ref=e192]
              - cell "30 Jan 2027" [ref=e194]
              - cell "2,950" [ref=e195]
              - cell "—" [ref=e196]
              - cell [ref=e197]:
                - button "View" [ref=e198] [cursor=pointer]
                - button "Edit" [ref=e202] [cursor=pointer]
                - button "Delete" [ref=e206] [cursor=pointer]
            - row [ref=e210]:
              - cell "Factory Reception" [ref=e211]
              - cell "Amit Singh" [ref=e216]
              - cell "Commercial" [ref=e220]
              - cell "Execution" [ref=e221]
              - cell "Active" [ref=e222]
              - cell "20 Sep 2026" [ref=e224]
              - cell "2,300" [ref=e225]
              - cell "—" [ref=e226]
              - cell [ref=e227]:
                - button "View" [ref=e228] [cursor=pointer]
                - button "Edit" [ref=e232] [cursor=pointer]
                - button "Delete" [ref=e236] [cursor=pointer]
            - row [ref=e240]:
              - cell "Hospitality Lounge" [ref=e241]
              - cell "Kavya Desai" [ref=e246]
              - cell "Hospitality" [ref=e250]
              - cell "Completed" [ref=e251]
              - cell "Completed" [ref=e252]
              - cell "1 Aug 2026" [ref=e254]
              - cell "2,490" [ref=e255]
              - cell "—" [ref=e256]
              - cell [ref=e257]:
                - button "View" [ref=e258] [cursor=pointer]
                - button "Edit" [ref=e262] [cursor=pointer]
                - button "Delete" [ref=e266] [cursor=pointer]
            - row [ref=e270]:
              - cell "Training Centre" [ref=e271]
              - cell "Rajesh Patel" [ref=e276]
              - cell "Commercial" [ref=e280]
              - cell "Design" [ref=e281]
              - cell "Active" [ref=e282]
              - cell "12 Nov 2026" [ref=e284]
              - cell "980" [ref=e285]
              - cell "—" [ref=e286]
              - cell [ref=e287]:
                - button "View" [ref=e288] [cursor=pointer]
                - button "Edit" [ref=e292] [cursor=pointer]
                - button "Delete" [ref=e296] [cursor=pointer]
```