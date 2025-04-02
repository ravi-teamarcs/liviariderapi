import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../entity/user.entity';
import { UserData } from '../../entity/userdata.entity';
import { Repository } from 'typeorm';

export class BaseService {
  private salt?: string;
  private method?: string;
  // private userRepository: Repository<User>;
  private userDataRepository: Repository<UserData>;

  constructor(salt?: string, method?: string) {
    this.salt = salt;
    this.method = method;
  }

  hashPassword(password?: string): string {
    if (!password) {
      password = `${Date.now()}-Livia`; // Equivalent to `uniqid().'-Livia'`
    }

    if (this.method === 'md5') {
      return crypto.createHash('md5').update(this.salt + password).digest('hex');
    } else if (this.method === 'sha1') {
      return crypto.createHash('sha1').update(this.salt + password).digest('hex');
    } else if (this.method === 'bcrypt') {
      const saltRounds = 14; // Bcrypt cost
      return bcrypt.hashSync(password, saltRounds);
    } else {
      throw new Error('Invalid hashing method');
    }
  }

  // async getLocationFromLatLong(latitude: any, longitude: any): Promise<string> {
  //   const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  //   const url = `${process.env.GOOGLE_MAPS_API_URL}${latitude},${longitude}&key=${apiKey}`;
  //   console.log(url)
  //   const response = await fetch(url);
  //   const data = await response.json();
  //   console.log(data)
  //   console.log(data.status)
  //   if (data.status === 'OK' && data.results.length > 0) {
  //     return data.results[0].formatted_address;
  //   } else {
  //     throw new Error('Unable to fetch location from Google Maps API');
  //   }
  // }
  async getLocationFromLatLong(latitude: any, longitude: any): Promise<string> {
    try {
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      const url = `${process.env.GOOGLE_MAPS_API_URL}${latitude},${longitude}&key=${apiKey}`;
      console.log('Fetching:', url);
  
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
  
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
  
      const data = await response.json();
      console.log('Response:', data);
  
      if (data.status === 'OK' && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
  
      return 'Unknown Location';
    } catch (error) {
      console.error('Fetch error:', error.message || error);
      return 'Unknown Location';
    }
  }
  


  async getUserDetails(id: number, role: number) {
    const userDataArray = await this.userDataRepository
      .createQueryBuilder('userData')
      .where('userData.user_id = :id AND userData.role_id = :role', { id, role })
      .getMany();

    const userData = userDataArray.reduce((acc, curr) => {
      acc[curr.field_key] = curr.field_value;
      return acc;
    }, {});

    return userData;
  }

//   async calculateDistance(originLat: any, originLng: any, destLat: any, destLng: any): Promise<{distance: string, duration: string}> {
//     const apiKey = process.env.GOOGLE_MAPS_API_KEY;
//     const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${destLat},${destLng}&key=${apiKey}`;

//     const response = await fetch(url);
//     const data = await response.json();

//     if (data.status === 'OK' && data.rows[0]?.elements[0]?.status === 'OK') {
//       const element = data.rows[0].elements[0];
//       return {
//         distance: (element.distance.value / 1000).toFixed(2) + ' km',
//         duration: element.duration.text
//       };
//     } else {
//       throw new Error('Unable to calculate distance using Google Maps API');
//     }
//   }
// }
async calculateDistance(originLat: any, originLng: any, destLat: any, destLng: any): Promise<{ distance: string, duration: string }> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${destLat},${destLng}&key=${apiKey}`;
    console.log('Distance API URL:', url);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    const data = await response.json();
    console.log('Distance API Response:', JSON.stringify(data));

    if (data.status === 'OK' && data.rows?.[0]?.elements?.[0]?.status === 'OK') {
      const element = data.rows[0].elements[0];
      return {
        distance: (element.distance.value / 1000).toFixed(2) + ' km',
        duration: element.duration.text
      };
    } else {
      console.error('Google Maps API Distance Error:', data.status);
      return { distance: 'Unknown', duration: 'Unknown' };
    }
  } catch (error) {
    console.error('Fetch error in calculateDistance:', error.message || error);
    return { distance: 'Unknown', duration: 'Unknown' };
  }
}
}