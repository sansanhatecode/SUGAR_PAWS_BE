import { Module } from '@nestjs/common';
import { CityModule } from '../address/city/city.module';
import { DistrictModule } from '../address/district/district.module';
import { WardModule } from '../address/ward/ward.module';

@Module({
  imports: [CityModule, DistrictModule, WardModule],
  exports: [CityModule, DistrictModule, WardModule],
})
export class AddressModule {}
