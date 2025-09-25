import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { InputField, Button } from '../../../components/AuthComponents';
import { useAuth } from '../../../context/AuthContext';

export default function EditEmergencyContactsScreen() {
  const { userProfile, updateUserProfile } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize contacts from user profile or with an empty array
  const [contacts, setContacts] = useState(() => {
    // Ensure we're working with a valid array
    if (userProfile?.emergencyContacts && Array.isArray(userProfile.emergencyContacts)) {
      console.log('Loading emergency contacts:', JSON.stringify(userProfile.emergencyContacts));
      return [...userProfile.emergencyContacts];
    }
    return [];
  });
  
  // State for the currently edited contact
  const [editingIndex, setEditingIndex] = useState(-1); // -1 means adding new
  
  // Form data for the current contact being edited
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    relationship: '',
    email: '',
  });
  
  // Form validation errors
  const [errors, setErrors] = useState({
    name: '',
    phoneNumber: '',
    relationship: '',
    email: '',
  });
  
  // Edit an existing contact
  const startEditing = (index: number) => {
    setEditingIndex(index);
    setFormData({
      name: contacts[index].name,
      phoneNumber: contacts[index].phoneNumber,
      relationship: contacts[index].relationship,
      email: contacts[index].email || '',
    });
    setErrors({
      name: '',
      phoneNumber: '',
      relationship: '',
      email: '',
    });
  };
  
  // Start adding a new contact
  const startAddingContact = () => {
    setEditingIndex(-1);
    setFormData({
      name: '',
      phoneNumber: '',
      relationship: '',
      email: '',
    });
    setErrors({
      name: '',
      phoneNumber: '',
      relationship: '',
      email: '',
    });
  };
  
  // Handle form field changes
  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  // Validate the form
  const validateForm = () => {
    const newErrors = { ...errors };
    let isValid = true;
    
    if (!formData.name.trim()) {
      newErrors.name = 'Contact name is required';
      isValid = false;
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Contact phone number is required';
      isValid = false;
    } else if (!/^\+?\d{10,15}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
      isValid = false;
    }
    
    if (!formData.relationship.trim()) {
      newErrors.relationship = 'Relationship is required';
      isValid = false;
    }
    
    // Email validation if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  // Save the current contact (add new or update existing)
  const saveContact = () => {
    if (!validateForm()) return;
    
    const newContact = {
      name: formData.name,
      phoneNumber: formData.phoneNumber,
      relationship: formData.relationship,
      email: formData.email,
    };
    
    if (editingIndex === -1) {
      // Add new contact
      setContacts([...contacts, newContact]);
    } else {
      // Update existing contact
      const updatedContacts = [...contacts];
      updatedContacts[editingIndex] = newContact;
      setContacts(updatedContacts);
    }
    
    // Reset form
    startAddingContact();
  };
  
  // Remove a contact
  const removeContact = (index: number) => {
    Alert.alert(
      'Remove Contact',
      'Are you sure you want to remove this emergency contact?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          onPress: () => {
            const updatedContacts = [...contacts];
            updatedContacts.splice(index, 1);
            setContacts(updatedContacts);
          },
          style: 'destructive',
        },
      ]
    );
  };
  
  // Save all contacts to the user profile
  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      // Log contacts for debugging
      console.log('Saving emergency contacts:', JSON.stringify(contacts));
      
      // Ensure contacts is a valid array
      const contactsToSave = Array.isArray(contacts) ? contacts : [];
      console.log('Contact array is valid:', Array.isArray(contactsToSave));
      console.log('Contact array length:', contactsToSave.length);
      
      // Create a completely new array with plain objects (no references)
      const cleanContacts = contactsToSave.map(contact => ({
        name: contact.name || '',
        phoneNumber: contact.phoneNumber || '',
        relationship: contact.relationship || '',
        email: contact.email || ''
      }));
      
      console.log('Clean contacts to save:', JSON.stringify(cleanContacts));
      
      // Use a direct object for the update to avoid any reference issues
      const updateData = {
        emergencyContacts: cleanContacts,
        hasAddedEmergencyContact: cleanContacts.length > 0,
        updatedAt: Date.now()
      };
      
      console.log('Full update data:', JSON.stringify(updateData));
      
      await updateUserProfile(updateData);
      
      Alert.alert('Success', 'Emergency contacts updated successfully');
      // Navigate back to profile page
      router.push('/tabs/profile' as any);
    } catch (error) {
      console.error('Error saving contacts:', error);
      // @ts-ignore
      Alert.alert('Error', error.message || 'Failed to update emergency contacts');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Edit Emergency Contact',
          headerShown: true,
          headerTitleAlign: 'center',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.push('/tabs/profile' as any)}
              style={{ paddingHorizontal: 16 }}
            >
              <Ionicons name="arrow-back" size={24} color="#0284c7" />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* List of existing contacts */}
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
            
            {contacts.length === 0 ? (
              <Text style={styles.noContactsText}>No emergency contacts added yet.</Text>
            ) : (
              contacts.map((contact, index) => (
                <View key={index} style={styles.contactCard}>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactDetail}>
                      <Ionicons name="call-outline" size={14} color="#6b7280" /> {contact.phoneNumber}
                    </Text>
                    <Text style={styles.contactDetail}>
                      <Ionicons name="people-outline" size={14} color="#6b7280" /> {contact.relationship}
                    </Text>
                    {contact.email && (
                      <Text style={styles.contactDetail}>
                        <Ionicons name="mail-outline" size={14} color="#6b7280" /> {contact.email}
                      </Text>
                    )}
                  </View>
                  <View style={styles.contactActions}>
                    <TouchableOpacity 
                      onPress={() => startEditing(index)}
                      style={styles.editButton}
                    >
                      <Ionicons name="pencil" size={18} color="#0284c7" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => removeContact(index)}
                      style={styles.deleteButton}
                    >
                      <Ionicons name="trash" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
            
            <TouchableOpacity
              style={styles.addContactButton}
              onPress={startAddingContact}
            >
              <Ionicons name="add-circle" size={20} color="#0284c7" />
              <Text style={styles.addContactText}>Add New Contact</Text>
            </TouchableOpacity>
          </View>
          
          {/* Form for adding/editing contacts */}
          {editingIndex > -1 && (
            <View style={[styles.formContainer, { marginTop: 16 }]}>
              <Text style={styles.sectionTitle}>Edit Contact</Text>
              <InputField
                label="Full Name"
                value={formData.name}
                onChangeText={(text) => handleChange('name', text)}
                placeholder="Contact Name"
                error={errors.name}
                required
                leftIcon={<Ionicons name="person-outline" size={20} color="#9ca3af" />}
              />
              
              <InputField
                label="Phone Number"
                value={formData.phoneNumber}
                onChangeText={(text) => handleChange('phoneNumber', text)}
                placeholder="Contact Phone Number"
                keyboardType="phone-pad"
                error={errors.phoneNumber}
                required
                leftIcon={<Ionicons name="call-outline" size={20} color="#9ca3af" />}
              />
              
              <InputField
                label="Relationship"
                value={formData.relationship}
                onChangeText={(text) => handleChange('relationship', text)}
                placeholder="e.g. Parent, Spouse, Friend"
                error={errors.relationship}
                required
                leftIcon={<Ionicons name="people-outline" size={20} color="#9ca3af" />}
              />
              
              <InputField
                label="Email (Optional)"
                value={formData.email}
                onChangeText={(text) => handleChange('email', text)}
                placeholder="contact@example.com"
                keyboardType="email-address"
                error={errors.email}
              />
              
              <Button
                title="Save Contact"
                onPress={saveContact}
                style={styles.buttonMargin}
              />
              
              <Button
                title="Cancel"
                onPress={() => startAddingContact()}
                variant="outline"
                style={styles.buttonMargin}
              />
            </View>
          )}
          
          {editingIndex === -1 && (
            <View style={[styles.formContainer, { marginTop: 16 }]}>
              <Text style={styles.sectionTitle}>Add New Contact</Text>
              <InputField
                label="Full Name"
                value={formData.name}
                onChangeText={(text) => handleChange('name', text)}
                placeholder="Contact Name"
                error={errors.name}
                required
                leftIcon={<Ionicons name="person-outline" size={20} color="#9ca3af" />}
              />
              
              <InputField
                label="Phone Number"
                value={formData.phoneNumber}
                onChangeText={(text) => handleChange('phoneNumber', text)}
                placeholder="Contact Phone Number"
                keyboardType="phone-pad"
                error={errors.phoneNumber}
                required
                leftIcon={<Ionicons name="call-outline" size={20} color="#9ca3af" />}
              />
              
              <InputField
                label="Relationship"
                value={formData.relationship}
                onChangeText={(text) => handleChange('relationship', text)}
                placeholder="e.g. Parent, Spouse, Friend"
                error={errors.relationship}
                required
                leftIcon={<Ionicons name="people-outline" size={20} color="#9ca3af" />}
              />
              
              <InputField
                label="Email (Optional)"
                value={formData.email}
                onChangeText={(text) => handleChange('email', text)}
                placeholder="contact@example.com"
                keyboardType="email-address"
                error={errors.email}
                leftIcon={<Ionicons name="mail-outline" size={20} color="#9ca3af" />}
              />
              
              <Button
                title="Save Contact"
                onPress={saveContact}
                style={styles.buttonMargin}
              />
            </View>
          )}
          
          {/* Note about emergency contacts */}
          <View style={[styles.formContainer, { marginTop: 16 }]}>
            <View style={styles.noteContainer}>
              <Ionicons name="information-circle" size={20} color="#6b7280" />
              <Text style={styles.noteText}>
                Emergency contacts will be notified in crisis situations when you use safety features.
              </Text>
            </View>
            
            <Button
              title={isLoading ? 'Saving...' : 'Save All Changes'}
              onPress={handleSave}
              disabled={isLoading}
              style={styles.saveButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  buttonMargin: {
    marginTop: 10,
  },
  content: {
    padding: 20,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  formMarginTop: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  noteContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 24,
  },
  noteText: {
    flex: 1,
    marginLeft: 8,
    color: '#6b7280',
    fontSize: 14,
  },
  saveButton: {
    marginBottom: 16,
  },
  noContactsText: {
    textAlign: 'center',
    color: '#6b7280',
    fontStyle: 'italic',
    padding: 12,
  },
  contactCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  contactDetail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: 8,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
  },
  addContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e5e7eb',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: 8,
  },
  addContactText: {
    color: '#0284c7',
    fontWeight: '500',
    marginLeft: 8,
  },
});