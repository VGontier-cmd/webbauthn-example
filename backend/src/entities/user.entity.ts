/**
 * Entité User
 *
 * Représente un utilisateur dans la base de données.
 *
 * Relations :
 * - OneToMany avec Credential : Un utilisateur peut avoir plusieurs passkeys
 *
 * @module entities/user.entity
 */
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Credential } from "./credential.entity";

@Entity("users")
export class User {
  /**
   * ID unique de l'utilisateur (UUID)
   * Généré automatiquement par PostgreSQL
   */
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /**
   * Prénom de l'utilisateur
   */
  @Column()
  firstName: string;

  /**
   * Nom de l'utilisateur
   */
  @Column()
  lastName: string;

  /**
   * Email de l'utilisateur (unique)
   * Utilisé pour la connexion et comme identifiant WebAuthn
   */
  @Column({ unique: true })
  email: string;

  /**
   * Mot de passe hashé avec bcrypt
   * Ne doit jamais être retourné dans les réponses API
   */
  @Column()
  password: string;

  /**
   * Relation OneToMany avec les passkeys
   * Un utilisateur peut avoir plusieurs passkeys (une par appareil)
   */
  @OneToMany(() => Credential, (credential) => credential.user)
  credentials: Credential[];

  /**
   * Date de création du compte
   * Générée automatiquement lors de la création
   */
  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;
}
