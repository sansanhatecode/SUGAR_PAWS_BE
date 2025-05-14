import { Ward } from '../ward/ward.model';
import { District } from '../district/district.model';
import { City } from '../city/city.model';

export class ShippingAddress {
  id: number;
  userId: number;
  fullName: string;
  phoneNumber: string;
  homeNumber: string;
  wardCode: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  moreDetail: string;
  ward: Pick<Ward, 'wardCode' | 'name'> & {
    district: Pick<District, 'districtCode' | 'name'> & {
      city: Pick<City, 'cityCode' | 'name'>;
    };
  };
}
