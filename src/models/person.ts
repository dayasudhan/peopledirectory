import { builtinModules } from 'module';
import mongoose from 'mongoose';

// An interface that describes the Person properties
interface PersonAttrs {
    name: string,
    email: string,
    phone: number,
    addresses:[{
      label:string,
      addressLine:string,
      street:string, 
      city:string   
    }]
  }

  // An interface that describes the properties
// that a User Document has
interface PersonDoc extends mongoose.Document {
  name: string,
  email: string,
  phone: number,
  addresses:[{
    label:String,
    addressLine:String,
    street:String, 
    city:String   
  }]
  }

  //An interface that desrcribes the properties that a Person Model Has
  interface PersonModel extends mongoose.Model<PersonDoc>{
        build(attributes:PersonAttrs) :any;
  }
  //Person Schema
const PersonSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
      },
    email: {
        type: String,
        required: true
    },
    phone: {
      type: Number,
      required: true
    },
    addresses: {
        type: Array,
        required: true
    },
    isDeleted:{ //To make softdelete
      type:Boolean,
      required:true
    }
});

PersonSchema.statics.build =  (attributes: PersonAttrs) => {
    return new Person(attributes);
}
const Person = mongoose.model<PersonDoc,PersonModel>('Person',PersonSchema);


export { Person}; 