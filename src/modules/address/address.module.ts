import { Module } from '@nestjs/common';
import { CityModule } from './city/city.module';
import { DistrictModule } from './district/district.module';
import { WardModule } from './ward/ward.module';

@Module({
  imports: [CityModule, DistrictModule, WardModule],
  exports: [CityModule, DistrictModule, WardModule],
})
export class AddressModule {}
