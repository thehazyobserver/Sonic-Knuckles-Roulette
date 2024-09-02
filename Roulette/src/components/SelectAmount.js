import {  Grid, Box } from "@mui/material";
import { CustomTextField } from "./customTextField";
import CustomButton from "./CustomButton";

const SelectAmount = ({ TextFielValue, maxValue, onChangeValue, changeValue, buttonColor }) => {
    return (
      <Box xs={12}>
        <Grid container spacing={{ xs: 1, md: 0 }}>
          <Grid item xs={12} md={4}>
            <Grid container alignItems="center" justifyContent="center">
              <CustomTextField
                key={"hola"}
                sx={{backgroundColor: "#2a4649"}}
                size="normal"
                id="outlined-number"
                label="Amount of Tokens"
                type="number"
                color="secondary"
                value={TextFielValue}
                InputProps={{ inputProps: { min: 1, max: maxValue } }}
                onChange={onChangeValue}
                InputLabelProps={{
                  style: {
                    color: "white",
                  },
                }}
              />
            </Grid>
          </Grid>
          <Grid item xs={12} md={4}>
            <Grid container alignItems="center" justifyContent="center">
              <CustomButton
                display={"+1,000"}
                functionallity={()=>changeValue(parseInt(TextFielValue + 1000))}
                width={"15%"}
                size={'large'}
                backGround={buttonColor}
                text={'#e0e5bc'}
                margin= {0.5}
              />
              <CustomButton
                display={"+1M"}
                functionallity={()=>changeValue(parseInt(TextFielValue + 1000000))}
                width={"15%"}
                size={'large'}
                backGround={buttonColor}
                text={'#e0e5bc'}
                margin= {0.5}
              />
              <CustomButton
                display={"+1B"}
                functionallity={()=>changeValue(parseInt(TextFielValue + 1000000000))}
                width={"15%"}
                size={'large'}
                backGround={buttonColor}
                text={'#e0e5bc'}
                margin= {0.5}
              />
            </Grid>
          </Grid>
          <Grid item xs={12} md={4}>
            <Grid container alignItems="center" justifyContent="center">
            <CustomButton
                display={"X2"}
                functionallity={()=>changeValue(parseInt(TextFielValue*2))}
                width={"10%"}
                size={'large'}
                backGround={buttonColor}
                text={'#e0e5bc'}
                margin= {0.5}
              />
              <CustomButton
                display={"1/2"}
                functionallity={()=>changeValue(parseInt(TextFielValue/2))}
                width={"10%"}
                size={'large'}
                backGround={buttonColor}
                text={'#e0e5bc'}
                margin= {0.5}
              />
              <CustomButton
                display={"MAX"}
                functionallity={()=>changeValue(parseInt(maxValue))}
                width={"10%"}
                size={'large'}
                backGround={buttonColor}
                text={'#e0e5bc'}
                margin= {0.5}
              />
            </Grid>
          </Grid>
        </Grid>
      </Box>
    );
  };
  export default SelectAmount