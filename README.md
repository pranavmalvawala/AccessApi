# AccessApi
A shared API for managing authentication and authorization of LCS projects

### Dev Setup Instructions
This Project depends on [apiBase](https://github.com/LiveChurchSolutions/ApiBase). So let's pull it.

```bash
git submodule init && git submodule update
```

#### **AccessApi**  
1. Create a .env file and copy over the contents of dotenv.sample.txt in .env file.
1. Install dependencies - `npm i`
1. Run `npm run initdb` - to setup database.
1. Now run project using - `npm run dev`


## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

