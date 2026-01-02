/**
 * Entité Credential
 * 
 * Représente une passkey enregistrée dans la base de données.
 * 
 * Relations :
 * - ManyToOne avec User : Une passkey appartient à un utilisateur
 * 
 * @module entities/credential.entity
 */
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./user.entity";

@Entity("credentials")
export class Credential {
  /**
   * ID unique de la passkey (UUID)
   * Généré automatiquement par PostgreSQL
   */
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /**
   * Identifiant unique de la passkey (credential ID)
   * 
   * Format : base64url
   * Utilisé par WebAuthn pour identifier la passkey lors de l'authentification.
   * Correspond à l'ID retourné par l'authentificateur lors de l'enregistrement.
   */
  @Column()
  credentialId: string;

  /**
   * Clé publique de la passkey
   * 
   * Format : base64
   * Utilisée pour vérifier les signatures lors de l'authentification.
   * La clé privée reste sur l'authentificateur et n'est jamais transmise.
   */
  @Column("text")
  publicKey: string;

  /**
   * Compteur anti-replay
   * 
   * Incrémenté à chaque utilisation de la passkey.
   * Le backend vérifie que le compteur augmente toujours pour détecter
   * les attaques de replay (réutilisation d'une signature).
   */
  @Column()
  counter: number;

  /**
   * Type d'appareil sur lequel la passkey a été enregistrée
   * 
   * Exemples : "iOS Device", "Android Device", "Desktop"
   * Utilisé pour l'affichage dans l'interface utilisateur.
   */
  @Column()
  deviceType: string;

  /**
   * Indique si la passkey est sauvegardée (backup)
   * 
   * true : La passkey est sauvegardée (iCloud Keychain, Google Password Manager, etc.)
   * false : La passkey n'est pas sauvegardée (clé de sécurité physique)
   * 
   * Les passkeys sauvegardées peuvent être restaurées sur d'autres appareils.
   */
  @Column({ nullable: true })
  backedUp: boolean;

  /**
   * Relation ManyToOne avec User
   * Une passkey appartient à un utilisateur
   */
  @ManyToOne(() => User, (user) => user.credentials)
  @JoinColumn({ name: "userId" })
  user: User;

  /**
   * ID de l'utilisateur propriétaire de la passkey
   * Clé étrangère vers la table users
   */
  @Column()
  userId: string;

  /**
   * Date de création de la passkey
   * Générée automatiquement lors de l'enregistrement
   */
  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;
}
