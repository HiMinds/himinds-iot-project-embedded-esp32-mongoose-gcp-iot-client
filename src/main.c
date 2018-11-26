/*
 * Copyright (c) HiMinds.com
 *
 * Author:  Suru Dissanaike
 *
* MIT License
*
* Copyright (c) 2018
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/

#include <stdio.h>

#include "esp32/esp32_adc.h"
#include "esp_adc_cal.h"
#include "mgos.h"
#include "mgos_adc.h"
#include "mgos_system.h"
#include "mjs.h"


/* Custom configuration of the ADC */

int pc_adc_configuration(void)
{
   static int s_vref = 1100;

  // Using PIN32
  /*
    {.pin = 36, .ch = ADC1_CHANNEL_0},
    {.pin = 37, .ch = ADC1_CHANNEL_1},
    {.pin = 38, .ch = ADC1_CHANNEL_2},
    {.pin = 39, .ch = ADC1_CHANNEL_3},
    {.pin = 32, .ch = ADC1_CHANNEL_4},
    {.pin = 33, .ch = ADC1_CHANNEL_5},
    {.pin = 34, .ch = ADC1_CHANNEL_6},
    {.pin = 35, .ch = ADC1_CHANNEL_7},
  */

  if (adc1_config_width(ADC_WIDTH_12Bit) != ESP_OK || adc1_config_channel_atten(ADC1_CHANNEL_4, ADC_ATTEN_6db) != ESP_OK)
  {
    LOG(LL_INFO, ("fail ADC config"));
    return -1;
  }

  esp_adc_cal_characteristics_t *adc_chars = calloc(1, sizeof(esp_adc_cal_characteristics_t));
  esp_adc_cal_characterize(ADC_UNIT_1, ADC_ATTEN_6db, ADC_WIDTH_12Bit, s_vref, adc_chars);

  return 0;
}

enum mgos_app_init_result mgos_app_init(void)
{

  LOG(LL_INFO, ("----------- Ver 0.10 ------------"));

  return MGOS_APP_INIT_SUCCESS;
}